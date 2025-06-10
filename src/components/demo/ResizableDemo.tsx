
import React from 'react';
import { ResizableContainer } from '@/components/ui/resizable-container';
import { ResizableBlock } from '@/components/blocks/ResizableBlock';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ResizableDemo() {
  const sampleContent = [
    <Card>
      <CardHeader>
        <CardTitle>Panel 1</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This is the first resizable panel. You can drag the handle to resize it.</p>
      </CardContent>
    </Card>,
    <Card>
      <CardHeader>
        <CardTitle>Panel 2</CardTitle>
      </CardHeader>
      <CardContent>
        <p>This is the second resizable panel. It adjusts automatically when the first panel is resized.</p>
      </CardContent>
    </Card>
  ];

  const threePanelContent = [
    <div className="bg-primary/10 p-4 rounded">Panel A</div>,
    <div className="bg-secondary/10 p-4 rounded">Panel B</div>,
    <div className="bg-accent/10 p-4 rounded">Panel C</div>
  ];

  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="text-2xl font-bold mb-4">Resizable Components Demo</h2>
        
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Basic Two-Panel Layout</h3>
            <div className="h-64 border rounded-lg">
              <ResizableContainer
                defaultSizes={[40, 60]}
                minSize={25}
              >
                {sampleContent}
              </ResizableContainer>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Vertical Layout</h3>
            <div className="h-64 border rounded-lg">
              <ResizableContainer
                direction="vertical"
                defaultSizes={[30, 70]}
                minSize={20}
              >
                {sampleContent}
              </ResizableContainer>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Three-Panel Layout</h3>
            <div className="h-64 border rounded-lg">
              <ResizableContainer
                defaultSizes={[33, 33, 34]}
                minSize={15}
              >
                {threePanelContent}
              </ResizableContainer>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-2">Advanced Resizable Block with Controls</h3>
            <ResizableBlock
              defaultSizes={[45, 55]}
              showControls={true}
              onSizeChange={(sizes) => console.log('Sizes changed:', sizes)}
            >
              {sampleContent}
            </ResizableBlock>
          </div>
        </div>
      </div>
    </div>
  );
}
