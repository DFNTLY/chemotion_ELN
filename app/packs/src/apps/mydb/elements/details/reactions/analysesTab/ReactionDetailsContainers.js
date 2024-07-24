/* eslint-disable react/forbid-prop-types */
/* eslint-disable react/require-default-props */
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { Button, Accordion } from 'react-bootstrap';
import Container from 'src/models/Container';
import ContainerComponent from 'src/components/container/ContainerComponent';
import PrintCodeButton from 'src/components/common/PrintCodeButton';
import QuillViewer from 'src/components/QuillViewer';
import ImageModal from 'src/components/common/ImageModal';
import { hNmrCount, cNmrCount, instrumentText } from 'src/utilities/ElementUtils';
import { contentToText } from 'src/utilities/quillFormat';
import { chmoConversions } from 'src/components/OlsComponent';
import { previewContainerImage } from 'src/utilities/imageHelper';
import { JcampIds, BuildSpcInfos, BuildSpcInfosForNMRDisplayer, isNMRKind } from 'src/utilities/SpectraHelper';
import UIStore from 'src/stores/alt/stores/UIStore';
import UserStore from 'src/stores/alt/stores/UserStore';
import SpectraActions from 'src/stores/alt/actions/SpectraActions';
import LoadingActions from 'src/stores/alt/actions/LoadingActions';
import ViewSpectra from 'src/apps/mydb/elements/details/ViewSpectra';
import NMRiumDisplayer from 'src/components/nmriumWrapper/NMRiumDisplayer';
import TextTemplateActions from 'src/stores/alt/actions/TextTemplateActions';
import SpectraEditorButton from 'src/components/common/SpectraEditorButton';
// eslint-disable-next-line max-len
import { AnalysisVariationLink } from 'src/apps/mydb/elements/details/reactions/variationsTab/ReactionVariationsAnalyses';

const nmrMsg = (reaction, container) => {
  const ols = container.extended_metadata?.kind?.split('|')[0].trim();
  if (ols !== chmoConversions.nmr_1h?.termId && ols !== chmoConversions?.nmr_13c?.termId) {
    return '';
  }
  const nmrStr = container.extended_metadata && contentToText(container.extended_metadata.content);

  if ((container.extended_metadata.kind || '').split('|')[0].trim() === chmoConversions.nmr_1h.termId) {
    const msg = hNmrCount(nmrStr);
    return (
      <div className="d-inline text-dark">
        (
        <sup>1</sup>
        H:{msg}
        )
      </div>
    );
  } if ((container.extended_metadata.kind || '').split('|')[0].trim() === chmoConversions.nmr_13c.termId) {
    const msg = cNmrCount(nmrStr);
    return (
      <div className="d-inline-block ms-1 text-dark">
        (
        <sup>
          13
        </sup>
        C: {msg}
        )
      </div>
    );
  }
};

export default class ReactionDetailsContainers extends Component {
  constructor(props) {
    super();
    const { reaction } = props;
    this.state = {
      reaction,
      activeContainer: UIStore.getState().reaction.activeAnalysis
    };
    this.containerRefs = {};

    this.handleChange = this.handleChange.bind(this);
    this.handleAdd = this.handleAdd.bind(this);
    this.handleRemove = this.handleRemove.bind(this);
    this.handleUndo = this.handleUndo.bind(this);
    this.handleOnClickRemove = this.handleOnClickRemove.bind(this);
    this.handleAccordionOpen = this.handleAccordionOpen.bind(this);
    this.handleSpChange = this.handleSpChange.bind(this);
    this.onUIStoreChange = this.onUIStoreChange.bind(this);
  }

  componentDidMount() {
    const { activeContainer } = this.state;
    UIStore.listen(this.onUIStoreChange);
    TextTemplateActions.fetchTextTemplates('reaction');
    if (this.containerRefs[activeContainer]) {
      this.containerRefs[activeContainer].scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  componentWillUnmount() {
    UIStore.unlisten(this.onUIStoreChange);
  }

  onUIStoreChange(state) {
    const { activeContainer } = this.state;
    if (state.reaction.activeContainer !== activeContainer) {
      this.setState({
        activeContainer: state.reaction.activeContainer
      });
    }
  }

  // eslint-disable-next-line camelcase
  UNSAFE_componentWillReceiveProps(nextProps) {
    this.setState({
      reaction: nextProps.reaction,
    });
  }

  handleChange(container) {
    const { reaction } = this.state;
    this.props.parent.handleReactionChange(reaction);
  }

  handleSpChange(reaction, cb) {
    this.props.parent.handleReactionChange(reaction);
    cb();
  }

  handleUndo(container) {
    const { reaction } = this.state;
    container.is_deleted = false;
    this.props.parent.handleReactionChange(reaction, { schemaChanged: false });
  }

  handleAdd() {
    const { reaction } = this.state;
    const container = Container.buildEmpty();
    container.container_type = 'analysis';
    container.extended_metadata.content = { ops: [{ insert: '' }] };

    if (reaction.container.children.length === 0) {
      const analyses = Container.buildEmpty();
      analyses.container_type = 'analyses';
      reaction.container.children.push(analyses);
    }

    reaction.container.children.filter(element => (
      ~element.container_type.indexOf('analyses')
    ))[0].children.push(container);

    const newKey = reaction.container.children.filter(element => (
      ~element.container_type.indexOf('analyses')
    ))[0].children.length - 1;

    this.handleAccordionOpen(newKey);
    this.props.parent.handleReactionChange(reaction, { schemaChanged: false });
  }

  handleOnClickRemove(container) {
    if (confirm('Delete the container?')) {
      this.handleRemove(container);
    }
  }

  headerBtnGroup(container, reaction, readOnly) {
    const jcampIds = JcampIds(container);
    const hasJcamp = jcampIds.orig.length > 0;
    const confirmRegenerate = (e) => {
      e.stopPropagation();
      if (confirm('Regenerate spectra?')) {
        LoadingActions.start();
        SpectraActions.Regenerate(jcampIds, this.handleChange);
      }
    };

    const spcInfos = BuildSpcInfos(reaction, container);
    const { hasChemSpectra, hasNmriumWrapper } = UIStore.getState();
    const toggleSpectraModal = (e) => {
      e.stopPropagation();
      SpectraActions.ToggleModal();
      SpectraActions.LoadSpectra.defer(spcInfos);
    };

    //process open NMRium
    const toggleNMRDisplayerModal = (e) => {
      const spcInfosForNMRDisplayer = BuildSpcInfosForNMRDisplayer(reaction, container);
      e.stopPropagation();
      SpectraActions.ToggleModalNMRDisplayer();
      SpectraActions.LoadSpectraForNMRDisplayer.defer(spcInfosForNMRDisplayer); // going to fetch files base on spcInfos
    };

    const { chmos } = UserStore.getState();
    const hasNMRium = isNMRKind(container, chmos) && hasNmriumWrapper;

    return (
      <div className="d-flex justify-content-between align-items-center flex-row-reverse w-100 mb-0">
        <Button
          size="xsm"
          variant="danger"
          disabled={readOnly}
          onClick={() => this.handleOnClickRemove(container)}
        >
          <i className="fa fa-trash" />
        </Button>
        <PrintCodeButton element={reaction} analyses={[container]} ident={container.id} />
        <SpectraEditorButton
          element={reaction}
          hasJcamp={hasJcamp}
          spcInfos={spcInfos}
          hasChemSpectra={hasChemSpectra}
          toggleSpectraModal={toggleSpectraModal}
          confirmRegenerate={confirmRegenerate}
          toggleNMRDisplayerModal={toggleNMRDisplayerModal}
          hasNMRium={hasNMRium}
        />
        <AnalysisVariationLink
          reaction={reaction}
          analysisID={container.id}
        />
      </div>
    );
  };


  handleRemove(container) {
    const { reaction } = this.state;

    container.is_deleted = true;
    this.props.parent.handleReactionChange(reaction, { schemaChanged: false });
  }

  handleAccordionOpen(key) {
    this.setState({ activeContainer: key });
  }

  addButton() {
    const { readOnly } = this.props;
    if (!readOnly) {
      return (
        <div className="mt-2">
          <Button
            size="sm"
            variant="success"
            onClick={this.handleAdd}
          >
            Add analysis
          </Button>
        </div>

      );
    }
    return null;
  }

  render() {
    const { reaction, activeContainer } = this.state;
    const { readOnly } = this.props;

    const containerHeader = (container) => {
      let kind = container.extended_metadata.kind || '';
      kind = (kind.split('|')[1] || kind).trim();
      const insText = instrumentText(container);
      const previewImg = previewContainerImage(container);
      const status = container.extended_metadata.status || '';
      const content = container.extended_metadata.content || { ops: [{ insert: '' }] };
      const contentOneLine = {
        ops: content.ops.map((x) => {
          const c = Object.assign({}, x);
          if (c.insert) c.insert = c.insert.replace(/\n/g, ' ');
          return c;
        }),
      };
      let hasPop = true;
      let fetchNeeded = false;
      let fetchId = 0;
      if (previewImg.startsWith('data:image')) {
        fetchNeeded = true;
        fetchId = container.preview_img.id;
      } else {
        hasPop = false;
      }

      return (
        <div
          className="d-flex w-100 mb-0 h-25 light-grey-bg"
        >
          <div className="p-3">
            <ImageModal
              hasPop={hasPop}
              previewObject={{
                src: previewImg
              }}
              popObject={{
                title: container.name,
                src: previewImg,
                fetchNeeded,
                fetchId
              }}
            />
          </div>

          <div className="d-flex flex-column justify-content-start ms-1 my-3 flex-grow-1">
            <div className="fs-4 fw-bold ms-2 text-truncate text-decoration-underline">{container.name}</div>
            <div className="fs-5 ms-2 mt-2">Type: {kind}</div>
            <div className="fs-5 ms-2 mt-2">
              Status:
              {status} {nmrMsg(reaction, container)}
              <span className="me-5" />
              {insText}
            </div>
            <div className="fs-5 ms-2 mt-2 d-flex p-0">
              <span className="me-2">
                Content:
                <QuillViewer value={contentOneLine} className="overflow-wrap" />
              </span>
            </div>
          </div>
          <div className="ml-auto mt-3 d-flex align-items-start justify-content-end w-100 me-2">
            <div className="d-flex">
              {
                this.headerBtnGroup(container, reaction, readOnly)
              }
            </div>
          </div>
        </div>
      );
    };

    const containerHeaderDeleted = (container) => {
      const kind = container.extended_metadata.kind && container.extended_metadata.kind !== '';
      const titleKind = kind ? (` - Type: ${(container.extended_metadata.kind.split('|')[1] || container.extended_metadata.kind).trim()}`) : '';

      const status = container.extended_metadata.status && container.extended_metadata.status != '';
      const titleStatus = status ? (' - Status: ' + container.extended_metadata.status) : '';

      return (
        <div className="d-flex w-100 mb-0 light-grey-bg align-items-center">
          <strike className="flex-grow-1">
            {container.name}
            {titleKind}
            {titleStatus}            
          </strike>
          <Button
            className="ml-auto"
              size="sm"
              variant="danger"
              onClick={() => this.handleUndo(container)}>
              <i className="fa fa-undo" />
            </Button>
        </div>
      );
    };

    if (reaction.container != null && reaction.container.children) {
      const analyses_container = reaction.container.children.filter(element => (
        ~element.container_type.indexOf('analyses')
      ));

      if (analyses_container.length === 1 && analyses_container[0].children.length > 0) {
        return (
          <div>
            <div className="mb-2 me-1 d-flex flex-row-reverse">
              {this.addButton()}
            </div>
            <Accordion id="reaction-analyses-panel" activeKey={activeContainer} onSelect={this.handleAccordionOpen} accordion>
              {analyses_container[0].children.map((container, key) => {
                if (container.is_deleted) {
                  return (
                    <Accordion.Item
                      eventKey={key}
                      key={`reaction_container_deleted_${container.id}`}
                    >
                      <Accordion.Header>{containerHeaderDeleted(container)}</Accordion.Header>
                    </Accordion.Item>
                  );
                }

                return (
                  <div
                    ref={(element) => { this.containerRefs[key] = element; }}
                    key={`reaction_container_${container.id}`}
                  >
                    <Accordion.Item eventKey={key}>
                      <Accordion.Header>
                          {containerHeader(container)}
                      </Accordion.Header>
                      <Accordion.Body>
                        <ContainerComponent
                          disabled={readOnly}
                          readOnly={readOnly}
                          templateType="reaction"
                          container={container}
                          onChange={this.handleChange.bind(this, container)}
                        />
                        <ViewSpectra
                          sample={reaction}
                          handleSampleChanged={this.handleSpChange}
                          handleSubmit={this.props.handleSubmit}
                        />
                        <NMRiumDisplayer
                          sample={reaction}
                          handleSampleChanged={this.handleSpChange}
                          handleSubmit={this.props.handleSubmit}
                        />
                      </Accordion.Body>
                    </Accordion.Item>
                  </div>
                );
              })}
            </Accordion>
          </div>
        );
      }

      return (
        <div className="d-flex align-items-center justify-content-between mb-2 mt-4 mx-3">
          <span className="ms-3"> There are currently no Analyses. </span>
          <div>
            {this.addButton()}
          </div>
        </div>
      );
    }

    return (
      <div className="m-4">
        There are currently no Analyses.
      </div>
    );
  }
}

ReactionDetailsContainers.propTypes = {
  readOnly: PropTypes.bool,
  parent: PropTypes.object,
  handleSubmit: PropTypes.func
};
