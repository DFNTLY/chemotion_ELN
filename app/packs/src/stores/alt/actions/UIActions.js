import alt from 'src/stores/alt/alt';
import UIFetcher from 'src/fetchers/UIFetcher';

// An element object has a type and an id, e.g., {type: 'sample', id: 1}
class UIActions {
  initialize() {
    return (dispatch) => {
      UIFetcher.initialize()
        .then(json => dispatch(json))
        .catch(err => console.log(err)); // eslint-disable-line
    };
  }

  showCollectionManagement() {
    return null;
  }

  toggleCollectionManagement() {
    return null;
  }

  showElements() {
    return null;
  }

  showDeviceManagement() {
    return null
  }

  closeDeviceManagement() {
    return null
  }

  selectTab(params) {
    return params;
  }

  selectActiveAnalysisTab(tabKey) {
    return tabKey;
  }

  selectActiveAnalysis(params) {
    return params;
  }

  toggleAdvancedSearch(show) {
    return show
  }

  selectCollection(collection) {
    return collection
  }

  checkAllElements(params) {
    return params;
  }

  toggleShowPreviews(show) {
    return show;
  }

  checkElement(params) {
    return params;
  }

  uncheckAllElements(params) {
    return params;
  }

  uncheckWholeSelection() {
    return null;
  }

  uncheckElement(element) {
    return element;
  }

  selectElement(element) {
    return element;
  }

  deselectAllElementsOfType(type) {
    return type;
  }

  deselectAllElements() {
    return null;
  }

  setPagination(pagination) {
    return pagination;
  }

  setSearchSelection(selection) {
    return selection;
  }

  setSearchById(selection) {
    return selection;
  }

  selectCollectionWithoutUpdating(collection) {
    return collection;
  }

  clearSearchSelection() {
    return null;
  }

  clearSearchById() {
    return null;
  }

  changeNumberOfResultsShown(value) {
    return value;
  }

  updateModalProps(params) {
    return params
  }

  hideModal() {
    return null
  }

  setFilterCreatedAt(filterCreatedAt) {
    return filterCreatedAt;
  }

  setUserLabel(label) {
    return label;
  }

  setFromDate(date) {
    return date;
  }

  setToDate(date) {
    return date;
  }

  setProductOnly(bool) {
    return bool;
  }

  rerenderGenericWorkflow(params) { return params; }
  showGenericWorkflowModal(show) { return show; }
}

export default alt.createActions(UIActions);
