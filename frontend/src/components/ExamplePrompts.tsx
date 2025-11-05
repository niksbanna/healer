import { HelpCircle, Stethoscope, ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ExamplePromptsProps {
  onPromptClick: (prompt: string, triggerUpload?: boolean) => void;
}

export const ExamplePrompts = ({ onPromptClick }: ExamplePromptsProps) => {
  const examples = [
    {
      icon: HelpCircle,
      question: "What are the common symptoms of Type 2 diabetes and how is it diagnosed?",
      triggerUpload: false
    },
    {
      icon: Stethoscope,
      question: "I've been experiencing persistent headaches in the morning. What could be the possible causes?",
      triggerUpload: false
    },
    {
      icon: ImageIcon,
      question: "Can you analyze this medical image and identify any abnormalities?",
      triggerUpload: true
    }
  ];

  return (
    <div className="grid gap-3 max-w-3xl mx-auto">
      {examples.map((example, index) => {
        const Icon = example.icon;
        return (
          <Button
            key={index}
            variant="outline"
            className="h-auto py-4 px-5 text-left justify-start hover:bg-secondary hover:border-primary/30 transition-all group"
            onClick={() => onPromptClick(example.question, example.triggerUpload)}
          >
            <div className="flex items-start gap-3 w-full">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <Icon className="w-5 h-5 text-primary" />
              </div>
              <p className="text-sm text-foreground/80 group-hover:text-foreground transition-colors flex-1">
                {example.question}
              </p>
            </div>
          </Button>
        );
      })}
    </div>
  );
};
