"use client";

import { useState } from "react";
import { Text, View } from "react-native";
import { StarRating } from "./star-rating";
import { NativeStage } from "./native-stage";

const AMBER = "hsl(38 92% 50%)";

export function StarRatingDemo() {
  const [stay, setStay] = useState(4);
  const [food, setFood] = useState(3.5);

  return (
    <NativeStage height={440}>
      {(c) => {
        const colors = { filled: AMBER, empty: c.border };
        return (
          <View style={{ flex: 1, padding: 24, gap: 22 }}>
            <Text style={{ fontSize: 26, fontWeight: "700", color: c.foreground }}>Your stay</Text>

            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: c.foreground }}>Room</Text>
              <StarRating value={stay} onChange={setStay} label="Room rating" colors={colors} />
              <Text style={{ fontSize: 13, color: c.mutedForeground }}>
                {stay === 0 ? "Not rated" : `${stay} of 5. Drag across the stars.`}
              </Text>
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: c.foreground }}>
                Breakfast (halves allowed)
              </Text>
              <StarRating
                value={food}
                onChange={setFood}
                allowHalf
                label="Breakfast rating"
                colors={colors}
              />
              <Text style={{ fontSize: 13, color: c.mutedForeground }}>{food} of 5</Text>
            </View>

            <View style={{ gap: 8 }}>
              <Text style={{ fontSize: 14, fontWeight: "600", color: c.foreground }}>
                Guest average (read only)
              </Text>
              <StarRating
                value={4.5}
                allowHalf
                readOnly
                size={24}
                label="Guest average"
                colors={colors}
              />
            </View>
          </View>
        );
      }}
    </NativeStage>
  );
}

export default StarRatingDemo;
