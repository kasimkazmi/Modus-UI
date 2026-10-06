import fs from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { registry } from "@/registry";

/**
 * Keeps each doc's `## Props` table in step with the component's real props,
 * using the TypeScript compiler API (the approach of React Bits'
 * scripts/checkPropDocs.js). The component code is the source of truth.
 */

const ROOT = process.cwd();
const SRC = path.join(ROOT, "src");

// Props a component declares that its table does not have to list.
const UNDOCUMENTED = new Set([
  // Every wrapper takes children; the usage example shows them.
  "children",
  // Standard on every component (merged with cn()); not worth a row per table.
  "className",
]);

type Scalar = string | number | boolean;

interface ComponentProps {
  /** Every prop the props type accepts, inherited HTML attributes included. */
  accepted: Set<string>;
  /** Props the component itself declares (its own interface members and destructured names). */
  declared: Set<string>;
  /** Scalar defaults from the destructured parameter. */
  defaults: Map<string, Scalar>;
}

interface Row {
  prop: string;
  default: string;
}

const config = ts.getParsedCommandLineOfConfigFile(
  path.join(ROOT, "tsconfig.json"),
  {},
  { ...ts.sys, onUnRecoverableConfigFileDiagnostic: () => {} },
)!;
const files = registry.map((item) => path.join(SRC, item.files[0]));
const program = ts.createProgram(files, { ...config.options, incremental: false });
const checker = program.getTypeChecker();

const pascal = (name: string) =>
  name.replace(/(^|-)([a-z])/g, (_, __, char: string) => char.toUpperCase());

/** Top-level `const NAME = <initializer>` declarations, for resolving identifier defaults. */
function constants(source: ts.SourceFile) {
  const map = new Map<string, ts.Expression | undefined>();
  for (const statement of source.statements) {
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name))
        map.set(declaration.name.text, declaration.initializer);
    }
  }
  return map;
}

/** A literal default's value, or undefined for anything non-scalar. */
function scalar(
  node: ts.Expression | undefined,
  consts: Map<string, ts.Expression | undefined>,
  seen = new Set<string>(),
): Scalar | undefined {
  if (!node) return undefined;
  if (ts.isAsExpression(node) || ts.isParenthesizedExpression(node))
    return scalar(node.expression, consts, seen);
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
    const value = scalar(node.operand, consts, seen);
    return typeof value === "number" ? -value : undefined;
  }
  if (ts.isIdentifier(node) && !seen.has(node.text)) {
    return scalar(consts.get(node.text), consts, new Set([...seen, node.text]));
  }
  return undefined;
}

/** The function implementing the component: a function declaration or a const arrow/function, unwrapping memo/forwardRef. */
function findComponent(
  source: ts.SourceFile,
  name: string,
): ts.FunctionLikeDeclaration | undefined {
  const unwrap = (node: ts.Expression | undefined): ts.FunctionLikeDeclaration | undefined => {
    if (!node) return undefined;
    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return node;
    if (
      ts.isCallExpression(node) &&
      /^(React\.)?(memo|forwardRef)$/.test(node.expression.getText(source))
    )
      return unwrap(node.arguments[0]);
    return undefined;
  };
  for (const statement of source.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name?.text === name) return statement;
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name) && declaration.name.text === name)
          return unwrap(declaration.initializer);
      }
    }
  }
  return undefined;
}

function readComponent(file: string, name: string): ComponentProps {
  const source = program.getSourceFile(file)!;
  const component = findComponent(source, name);
  if (!component) throw new Error(`Cannot find component ${name} in ${file}`);
  const parameter = component.parameters[0];
  if (!parameter) return { accepted: new Set(), declared: new Set(), defaults: new Map() };

  const type = checker.getTypeAtLocation(parameter);
  const accepted = new Set(type.getProperties().map((symbol) => symbol.name));
  // Members declared in this file are the component's own; inherited DOM attributes are not.
  const declared = new Set(
    type
      .getProperties()
      .filter((symbol) => symbol.declarations?.some((d) => d.getSourceFile() === source))
      .map((symbol) => symbol.name),
  );

  let binding: ts.BindingName = parameter.name;
  if (ts.isIdentifier(binding)) {
    // `function X(props) { const { a = 1 } = props; }`
    const propsName = binding.text;
    const body = component.body && ts.isBlock(component.body) ? component.body.statements : [];
    for (const statement of body) {
      if (!ts.isVariableStatement(statement)) continue;
      for (const declaration of statement.declarationList.declarations) {
        if (
          ts.isObjectBindingPattern(declaration.name) &&
          declaration.initializer?.getText(source) === propsName
        )
          binding = declaration.name;
      }
    }
  }
  const defaults = new Map<string, Scalar>();
  if (ts.isObjectBindingPattern(binding)) {
    const consts = constants(source);
    for (const element of binding.elements) {
      if (element.dotDotDotToken) continue;
      const prop = (element.propertyName ?? element.name).getText(source);
      declared.add(prop);
      const value = scalar(element.initializer, consts);
      if (value !== undefined) defaults.set(prop, value);
    }
  }
  return { accepted, declared, defaults };
}

/** Rows of the markdown table under `## Props`. */
function readTable(mdx: string): Row[] | undefined {
  const section = mdx.split(/^## Props\s*$/m)[1]?.split(/^## /m)[0];
  if (section === undefined) return undefined;
  return section
    .split("\n")
    .filter((line) => line.trim().startsWith("|"))
    .slice(2) // header and separator
    .map((line) => {
      const cells = line
        .trim()
        .replace(/^\||\|$/g, "")
        .split(/(?<!\\)\|/)
        .map((cell) => cell.trim());
      return { prop: cells[0].replace(/`/g, ""), default: cells[2] };
    });
}

/** Strips the backticks and quotes the table wraps a literal in. */
const normalize = (value: string) =>
  value
    .trim()
    .replace(/^`(.*)`$/, "$1")
    .replace(/^(["'])(.*)\1$/, "$2");

describe.each(registry)("$name props table", (item) => {
  const props = readComponent(path.join(SRC, item.files[0]), pascal(item.name));
  const mdx = fs.readFileSync(path.join(SRC, "content/docs", `${item.name}.mdx`), "utf8");
  const rows = readTable(mdx);

  // A component that takes no props needs no table.
  const takesProps = [...props.declared].some((prop) => !UNDOCUMENTED.has(prop));
  it("has a props table if it takes props", () => {
    if (takesProps) expect(rows, "missing `## Props` table").toBeDefined();
  });
  if (!rows) return;
  const documented = new Set(rows.map((row) => row.prop));

  it("only documents real props", () => {
    expect(rows.map((row) => row.prop).filter((prop) => !props.accepted.has(prop))).toEqual([]);
  });

  it("documents every prop the component declares", () => {
    expect(
      [...props.declared].filter((prop) => !documented.has(prop) && !UNDOCUMENTED.has(prop)),
    ).toEqual([]);
  });

  it("documents the real scalar defaults", () => {
    const mismatches = rows.flatMap((row) => {
      if (!props.defaults.has(row.prop)) return [];
      const actual = String(props.defaults.get(row.prop));
      return normalize(row.default) === actual
        ? []
        : [`${row.prop}: doc ${row.default}, code ${actual}`];
    });
    expect(mismatches).toEqual([]);
  });
});
