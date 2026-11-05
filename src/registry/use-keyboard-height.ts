import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

/**
 * The height of the on-screen keyboard, or 0 while it is hidden. On iOS it updates as the keyboard
 * starts to move, so a view can slide up alongside it; on Android it updates once the keyboard has
 * finished appearing. Always 0 on the web, where there is no on-screen keyboard to measure.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const ios = Platform.OS === "ios";
    const show = Keyboard.addListener(ios ? "keyboardWillShow" : "keyboardDidShow", (event) =>
      setHeight(event.endCoordinates.height),
    );
    const hide = Keyboard.addListener(ios ? "keyboardWillHide" : "keyboardDidHide", () =>
      setHeight(0),
    );
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
}
