import { DecryptedText } from "./decrypted-text";

export default function DecryptedTextDemo() {
  return (
    <div className="flex w-full flex-col gap-12 items-center justify-center p-12 bg-background border border-border rounded-xl min-h-[400px]">
      <DecryptedText
        text="Hover over me to decrypt"
        animateOn="hover"
        speed={40}
        maxIterations={15}
        encryptedClassName="text-muted-foreground/50"
        className="text-4xl md:text-5xl font-mono text-foreground font-medium tracking-tight"
        parentClassName="cursor-pointer"
      />
      
      <DecryptedText
        text="I animate automatically on view."
        animateOn="view"
        sequential={true}
        revealDirection="start"
        speed={40}
        encryptedClassName="text-primary/30"
        className="text-xl md:text-2xl font-mono text-primary tracking-tight"
      />
    </div>
  );
}
