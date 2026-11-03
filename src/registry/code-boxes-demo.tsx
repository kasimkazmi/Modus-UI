"use client";

import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { CodeBoxes } from "./code-boxes";
import { NativeStage } from "./native-stage";

const CORRECT = "482913";

export function CodeBoxesDemo() {
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [verified, setVerified] = useState(false);

  const check = (entered: string) => {
    setTimeout(() => {
      if (entered === CORRECT) {
        setVerified(true);
        return;
      }
      setError(true);
      setTimeout(() => {
        setError(false);
        setCode("");
      }, 900);
    }, 400);
  };

  return (
    <NativeStage height={420}>
      {(c) => (
        <View style={{ flex: 1, justifyContent: "center", gap: 20, paddingHorizontal: 24 }}>
          <View style={{ gap: 6 }}>
            <Text style={{ fontSize: 24, fontWeight: "700", color: c.foreground }}>
              {verified ? "Phone verified" : "Verify your phone"}
            </Text>
            <Text style={{ fontSize: 14, color: c.mutedForeground }}>
              {verified
                ? "You are all set."
                : "Enter the 6 digit code we sent to your number. You can paste it too."}
            </Text>
          </View>
          <CodeBoxes
            value={code}
            onChange={setCode}
            onComplete={check}
            error={error}
            disabled={verified}
            colors={{
              box: c.card,
              border: c.border,
              focusBorder: c.primary,
              text: c.foreground,
              error: c.destructive,
            }}
          />
          {verified ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                setVerified(false);
                setCode("");
              }}
              style={{
                alignSelf: "flex-start",
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderRadius: 999,
                backgroundColor: c.primary,
              }}
            >
              <Text style={{ fontWeight: "600", color: c.primaryForeground }}>Start over</Text>
            </Pressable>
          ) : (
            <Text style={{ fontSize: 13, color: c.mutedForeground }}>
              {error ? "That code is not right. Try again." : `Hint: the code is ${CORRECT}`}
            </Text>
          )}
        </View>
      )}
    </NativeStage>
  );
}

export default CodeBoxesDemo;
