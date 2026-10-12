"use client";

import { ModusStage } from "@/components/modus-stage";
import { TrayPicker } from "./tray-picker";

export default function TrayPickerDemo() {
  return (
    <ModusStage caption="Tray Picker" layout="center">
      <TrayPicker />
    </ModusStage>
  );
}
