import { ExpandableShowcase, ShowcaseItem } from "./expandable-showcase";

const DEMO_ITEMS: ShowcaseItem[] = [
  { 
    id: 1, 
    image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=2000&auto=format&fit=crop', 
    label: 'Canyon' 
  },
  { 
    id: 2, 
    image: 'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?q=80&w=2000&auto=format&fit=crop', 
    label: 'Mountain Peak' 
  },
  { 
    id: 3, 
    image: 'https://images.unsplash.com/photo-1433086966358-54859d0ed716?q=80&w=2000&auto=format&fit=crop', 
    label: 'Waterfall' 
  },
  { 
    id: 4, 
    image: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=2000&auto=format&fit=crop', 
    label: 'Lush Forest' 
  },
  { 
    id: 5, 
    image: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=2000&auto=format&fit=crop', 
    label: 'Alpine Lake' 
  }
];

export default function ExpandableShowcaseDemo() {
  return (
    <div className="flex w-full flex-col gap-8 items-center justify-center p-8 bg-background">
      <div className="w-full max-w-4xl space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">Horizontal Gallery</h2>
        <ExpandableShowcase 
          items={DEMO_ITEMS} 
          defaultIndex={2} 
        />
      </div>

      <div className="w-full max-w-lg space-y-4 mt-8">
        <h2 className="text-2xl font-semibold text-foreground">Vertical Gallery</h2>
        <ExpandableShowcase 
          items={DEMO_ITEMS} 
          defaultIndex={0} 
          orientation="vertical"
          height={500}
        />
      </div>
    </div>
  );
}
