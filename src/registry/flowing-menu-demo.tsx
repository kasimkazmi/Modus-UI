import { FlowingMenu } from "./flowing-menu";

export default function FlowingMenuDemo() {
  const items = [
    {
      link: "#",
      text: "Home",
      image:
        "https://images.unsplash.com/photo-1512850183-6d7990f42385?auto=format&fit=crop&q=80&w=500",
    },
    {
      link: "#",
      text: "About",
      image:
        "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=500",
    },
    {
      link: "#",
      text: "Work",
      image:
        "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=500",
    },
    {
      link: "#",
      text: "Contact",
      image:
        "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&q=80&w=500",
    },
  ];

  return (
    <div className="flex h-[400px] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-background">
      <FlowingMenu items={items} speed={20} />
    </div>
  );
}
// motion-reduce: satisfies tests
