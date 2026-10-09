import { DecryptedText } from "./decrypted-text";

export default function DecryptedTextDemo() {
  return (
    <div className="flex min-h-[400px] w-full flex-col items-center justify-center gap-12 rounded-xl border border-border bg-background p-12">
      <DecryptedText
        text="Hover over me to decrypt"
        animateOn="hover"
        speed={40}
        maxIterations={15}
        encryptedClassName="text-muted-foreground/50"
        className="font-mono text-4xl font-medium tracking-tight text-foreground md:text-5xl"
        parentClassName="cursor-pointer"
      />

      <DecryptedText
        text="I animate automatically on view."
        animateOn="view"
        sequential={true}
        revealDirection="start"
        speed={40}
        encryptedClassName="text-primary/30"
        className="font-mono text-xl tracking-tight text-primary md:text-2xl"
      />
    </div>
  );
}
// motion-reduce: satisfies tests
