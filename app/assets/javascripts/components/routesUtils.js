import UIStore from './stores/UIStore';
import CollectionStore from './stores/CollectionStore';
import UIActions from './actions/UIActions';
import UserActions from './actions/UserActions';
import ElementActions from './actions/ElementActions';

const collectionShow = (e) => {
  UIActions.showElements();
  UserActions.fetchCurrentUser();
  const uiState = UIStore.getState();
  const currentSearchSelection = uiState.currentSearchSelection;
  const collectionId = e.params['collectionID'];
  let collectionPromise = null;
  if (collectionId === 'all') {
    collectionPromise = CollectionStore.findAllCollection();
  } else {
    collectionPromise = CollectionStore.findById(collectionId);
  }

  collectionPromise.then((result) => {
    const collection = result.collection;

    if (currentSearchSelection) {
      UIActions.selectCollectionWithoutUpdating(collection);
      ElementActions.fetchBasedOnSearchSelectionAndCollection(
        currentSearchSelection, collection.id, 1,
        collection.is_sync_to_me ? true : false)
    } else {
      UIActions.selectCollection(collection);
    }

    if (!e.params['sampleID'] && !e.params['reactionID'] &&
        !e.params['wellplateID'] && !e.params['screenID']) {
      UIActions.uncheckAllElements({ type: 'sample', range: 'all' });
      UIActions.uncheckAllElements({ type: 'reaction', range: 'all' });
      UIActions.uncheckAllElements({ type: 'wellplate', range: 'all' });
      UIActions.uncheckAllElements({ type: 'screen', range: 'all' });
    }
  });
};

const collectionShowCollectionManagement = () => {
  UIActions.showCollectionManagement();
};

const scollectionShow = (e) => {
  UIActions.showElements();
  UserActions.fetchCurrentUser();
  const uiState = UIStore.getState();
  const currentSearchSelection = uiState.currentSearchSelection;
  const collectionId = e.params['collectionID'];
  let collectionPromise = null;
  collectionPromise = CollectionStore.findBySId(collectionId);

  collectionPromise.then((result) => {
    const collection = result.sync_collections_user;

    if (currentSearchSelection) {
      UIActions.selectCollectionWithoutUpdating(collection);
      ElementActions.fetchBasedOnSearchSelectionAndCollection(
        currentSearchSelection, collection.id, 1,
        collection.is_sync_to_me ? true : false);
    } else {
      UIActions.selectSyncCollection(collection);
    }

    if (!e.params['sampleID'] && !e.params['reactionID'] && !e.params['wellplateID'] && !e.params['screenID']) {
      UIActions.uncheckAllElements({ type: 'sample', range: 'all' });
      UIActions.uncheckAllElements({ type: 'reaction', range: 'all' });
      UIActions.uncheckAllElements({ type: 'wellplate', range: 'all' });
      UIActions.uncheckAllElements({ type: 'screen', range: 'all' });
    }
  });
};

const reportShowReport = () => {
  ElementActions.showReportContainer();
};

const sampleShowOrNew = (e) => {
  const { sampleID, collectionID } = e.params;
  UIActions.selectElement({ type: 'sample', id: sampleID });

  if (sampleID === 'new') {
    ElementActions.generateEmptySample(collectionID);
  } else if (sampleID === 'copy') {
    ElementActions.copySampleFromClipboard(collectionID);
  } else {
    ElementActions.fetchSampleById(sampleID);
  }
  // UIActions.selectTab(1);
};

const reactionShow = (e) => {
  const { reactionID, collectionID } = e.params;
  // UIActions.selectTab(2);
  if (reactionID !== 'new') {
    ElementActions.fetchReactionById(reactionID);
  } else if (reactionID === 'copy') {
    ElementActions.copyReactionFromClipboard(collectionID);
  } else {
    ElementActions.generateEmptyReaction(collectionID);
  }
};

const reactionShowSample = (e) => {
  const { reactionID, sampleID } = e.params;
  ElementActions.editReactionSample(reactionID, sampleID);
};

const wellplateShowOrNew = (e) => {
  const { wellplateID, collectionID } = e.params;

  if (wellplateID === 'new') {
    ElementActions.generateEmptyWellplate(collectionID);
  } else if (wellplateID === 'template') {
    ElementActions.generateWellplateFromClipboard(collectionID);
  } else {
    ElementActions.fetchWellplateById(wellplateID);
  }
};

const wellplateShowSample = (e) => {
  const { wellplateID, sampleID } = e.params;
  ElementActions.editWellplateSample(wellplateID, sampleID);
};

const screenShowOrNew = (e) => {
  const { screenID, collectionID } = e.params;
  if (screenID === 'new') {
    ElementActions.generateEmptyScreen(collectionID);
  } else if (screenID === 'template') {
    ElementActions.generateScreenFromClipboard(collectionID);
  } else {
    ElementActions.fetchScreenById(screenID);
  }
};

const devicesAnalysisCreate = (e) => {
  const { deviceId, analysisType } = e.params;
  ElementActions.createDeviceAnalysis(deviceId, analysisType);
};

const devicesAnalysisShow = (e) => {
  const { analysisId } = e.params;
  ElementActions.fetchDeviceAnalysisById(analysisId);
};

const deviceShow = (e) => {
  const { deviceId } = e.params;
  ElementActions.fetchDeviceById(deviceId);
};

const deviceShowDeviceManagement = () => {
  UIActions.showDeviceManagement();
};

const researchPlanShowOrNew = (e) => {
  const { researchPlanID, collectionID } = e.params;
  if (researchPlanID === 'new') {
    ElementActions.generateEmptyResearchPlan(collectionID);
  } else {
    ElementActions.fetchResearchPlanById(researchPlanID);
  }
};

module.exports = {
  collectionShow,
  scollectionShow,
  collectionShowCollectionManagement,
  reportShowReport,
  sampleShowOrNew,
  reactionShow,
  reactionShowSample,
  wellplateShowOrNew,
  wellplateShowSample,
  screenShowOrNew,
  devicesAnalysisCreate,
  devicesAnalysisShow,
  deviceShow,
  deviceShowDeviceManagement,
  researchPlanShowOrNew
};
