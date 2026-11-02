"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { FloatField } from "./float-field";
import { NativeStage } from "./native-stage";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function FloatFieldDemo() {
  const [email, setEmail] = useState("");
  const [touched, setTouched] = useState(false);
  const [password, setPassword] = useState("");

  const emailError =
    touched && email.length > 0 && !EMAIL.test(email)
      ? "Enter an email like name@example.com"
      : undefined;
  const passwordError =
    password.length > 0 && password.length < 8 ? "Use at least 8 characters" : undefined;

  return (
    <NativeStage height={440}>
      {(c) => {
        const colors = {
          background: c.card,
          border: c.border,
          focusBorder: c.primary,
          label: c.mutedForeground,
          text: c.foreground,
          error: c.destructive,
          helper: c.mutedForeground,
        };
        return (
          <View style={{ flex: 1, justifyContent: "center", gap: 18, paddingHorizontal: 24 }}>
            <View style={{ gap: 4 }}>
              <Text style={{ fontSize: 24, fontWeight: "700", color: c.foreground }}>
                Create account
              </Text>
              <Text style={{ fontSize: 14, color: c.mutedForeground }}>
                Labels float up as you type.
              </Text>
            </View>
            <FloatField
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (text.includes("@")) setTouched(true);
              }}
              keyboardType="email-address"
              helper="We only use it to sign you in"
              error={emailError}
              colors={colors}
            />
            <FloatField
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              helper="At least 8 characters"
              error={passwordError}
              colors={colors}
            />
            <FloatField
              label="Referral code"
              value=""
              onChangeText={() => {}}
              disabled
              helper="Not available yet"
              colors={colors}
            />
          </View>
        );
      }}
    </NativeStage>
  );
}

export default FloatFieldDemo;
