
import React from 'react';
import { AppLayoutWithSidebar } from '@/components/layout/AppLayoutWithSidebar';
import { ContentTypeGuidelines } from '@/components/content-types/ContentTypeGuidelines';

export function ContentTypeGuide() {
  return (
    <AppLayoutWithSidebar>
      <div className="flex-1 p-6 overflow-auto">
        <ContentTypeGuidelines />
      </div>
    </AppLayoutWithSidebar>
  );
}

export default ContentTypeGuide;
