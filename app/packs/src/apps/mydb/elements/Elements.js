import React, { useState, useEffect } from 'react';
import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels';

import ElementStore from 'src/stores/alt/stores/ElementStore';
import UIStore from 'src/stores/alt/stores/UIStore';

import ElementsList from 'src/apps/mydb/elements/list/ElementsList';
import ElementDetails from 'src/apps/mydb/elements/details/ElementDetails';

export default function Elements() {
  const [showDetailView, setShowDetailView] = useState(false);
  const [isDetailViewExpanded, setIsDetailViewExpanded] = useState(false);

  useEffect(() => {
    const onElementStoreChange = ({ currentElement }) => setShowDetailView(currentElement !== null);
    ElementStore.listen(onElementStoreChange);
    onElementStoreChange(ElementStore.getState());

    const onUiStoreChange = ({ isDetailViewExpanded }) => setIsDetailViewExpanded(isDetailViewExpanded);
    UIStore.listen(onUiStoreChange);
    onUiStoreChange(UIStore.getState());

    return () => {
      ElementStore.unlisten(onElementStoreChange);
      UIStore.unlisten(onUiStoreChange);
    }
  }, []);

  const detailWidth = showDetailView
    ? isDetailViewExpanded ? 12 : 7
    : 0;
  const listWidth = 12 - detailWidth;

  return (
    <div className="flex-grow-1">
      <PanelGroup className="p-3" direction="horizontal">
        {!isDetailViewExpanded && (
          <>
            <Panel className="overflow-x-auto">
              <div className="h-100" style={{ minWidth: '600px' }}>
                <ElementsList overview={!showDetailView} />
              </div>
            </Panel>
          </>
        )}

        {!isDetailViewExpanded && showDetailView && (
          <PanelResizeHandle className="px-1 mx-1" />
        )}

        {showDetailView && (
          <Panel className="overflow-x-auto">
            <div className="h-100" style={{ minWidth: '680px' }}>
              <ElementDetails />
            </div>
          </Panel>
        )}
      </PanelGroup>
    </div>
  );
}
