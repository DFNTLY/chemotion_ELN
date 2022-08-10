import React, { Component } from 'react';
import StickyDiv from 'react-stickydiv';
import { Tabs, Tab, Label, Button } from 'react-bootstrap';
import SampleDetails from 'src/components/SampleDetails';
import DeviceDetails from 'src/components/DeviceDetails';
import ReactionDetails from 'src/components/ReactionDetails';
import WellplateDetails from 'src/components/WellplateDetails';
import ScreenDetails from 'src/components/ScreenDetails';
import ResearchPlanDetails from 'src/components/research_plan/ResearchPlanDetails';
import ReportContainer from 'src/components/report/ReportContainer';
import FormatContainer from 'src/components/FormatContainer';
import GraphContainer from 'src/components/GraphContainer';
import ComputeTaskContainer from 'src/components/ComputeTaskContainer';
import DetailActions from 'src/stores/alt/actions/DetailActions';
import ElementStore from 'src/stores/alt/stores/ElementStore';
import LiteratureDetails from 'src/components/LiteratureDetails';
import PredictionContainer from 'src/components/prediction/PredictionContainer';
import GenericElDetails from 'src/components/generic/GenericElDetails';
import UserStore from 'src/stores/alt/stores/UserStore';
import CommentFetcher from 'src/components/fetchers/CommentFetcher';
import CommentModal from 'src/components/comments/CommentModal';

const tabInfoHash = {
  report: {
    title: 'Report',
    iconEl: (
      <span>
        <i className="fa fa-file-text-o" />&nbsp;&nbsp;
        <i className="fa fa-pencil" />
      </span>
    )
  },
  prediction: {
    title: 'Synthesis Prediction',
    iconEl: (
      <span>
        <i className="fa fa-percent" />
      </span>
    )
  },
  deviceCtrl: {
    title: 'Measurement',
    iconEl: (
      <span>
        <i className="fa fa-bar-chart" />
        <i className="fa fa-cogs" />
      </span>
    )
  },
  format: {
    title: 'Format',
    iconEl: (
      <span>
        <i className="fa fa-magic" />
      </span>
    )
  },
  graph: {
    title: 'Graph',
    iconEl: (
      <span>
        <i className="fa fa-area-chart" />
      </span>
    )
  },
  task: {
    title: 'Task',
    iconEl: (
      <span>
        <i className="fa fa-wrench" />
      </span>
    )
  },
  literature_map: {
    title: 'Literature',
    iconEl: (
      <span>
        <i className="fa fa-book" aria-hidden="true" />
      </span>
    )
  }
};

export default class ElementDetails extends Component {
  constructor(props) {
    super(props);
    const { selecteds, activeKey, deletingElement } = ElementStore.getState();
    this.state = {
      offsetTop: 70,
      fullScreen: false,
      selecteds,
      activeKey,
      deletingElement,
      showTooltip: false,
      genericEls: UserStore.getState().genericEls || [],
      comments: [],
      section: '',
      showCommentModal: false,
      showCommentSection: false,
    };

    this.handleResize = this.handleResize.bind(this);
    this.toggleFullScreen = this.toggleFullScreen.bind(this);
    this.onDetailChange = this.onDetailChange.bind(this);
    this.checkSpectraMessage = this.checkSpectraMessage.bind(this);
  }

  componentDidMount() {
    window.addEventListener('resize', this.handleResize);
    window.scrollTo(window.scrollX, window.scrollY + 1);
    // imitate scroll event to make StickyDiv element visible in current area
    ElementStore.listen(this.onDetailChange);
  }

  shouldComponentUpdate(nextProps, nextState) {
    return true;
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleResize);
    ElementStore.unlisten(this.onDetailChange);
  }

  onDetailChange(state) {
    const { selecteds, activeKey, deletingElement, spectraMsg } = state;
    this.setState(prevState => ({ ...prevState, selecteds, activeKey, deletingElement }));
    this.checkSpectraMessage(spectraMsg);
  }

  toggleFullScreen() {
    const { fullScreen } = this.state;
    this.setState({ fullScreen: !fullScreen });
  }

  handleResize() {
    const windowHeight = window.innerHeight || 1;
    if (this.state.fullScreen || windowHeight < 500) {
      this.setState({ offsetTop: 0 });
    } else {
      this.setState({ offsetTop: 70 });
    }
  }

  checkSpectraMessage(spectraMsg) {
    if (spectraMsg) {
      const { showedSpcMsgID } = this.state;
      if (!showedSpcMsgID || showedSpcMsgID !== spectraMsg.message_id) {
        this.setState({ showedSpcMsgID: spectraMsg.message_id })
        alert(spectraMsg.content.data);
      }
    }
  }

  content(el) {
    const {
      showCommentModal, showCommentSection, comments, section
    } = this.state;
    if (el && el.klassType === 'GenericEl' && el.type != null) {
      return <GenericElDetails genericEl={el} toggleFullScreen={this.toggleFullScreen} />;
    }

    switch (el.type) {
      case 'sample':
        return (
          <SampleDetails
            sample={el}
            showCommentModal={showCommentModal}
            showCommentSection={showCommentSection}
            comments={comments}
            section={section}
            setCommentSection={this.setCommentSection}
            getSectionComments={this.getSectionComments}
            fetchComments={this.fetchComments}
            renderCommentModal={this.renderCommentModal}
            toggleCommentModal={this.toggleCommentModal}
            toggleCommentSection={this.toggleCommentSection}
            toggleFullScreen={this.toggleFullScreen}
          />
        );
      case 'reaction':
        return (
          <ReactionDetails
            reaction={el}
            showCommentModal={showCommentModal}
            showCommentSection={showCommentSection}
            comments={comments}
            section={section}
            setCommentSection={this.setCommentSection}
            getSectionComments={this.getSectionComments}
            fetchComments={this.fetchComments}
            renderCommentModal={this.renderCommentModal}
            toggleCommentModal={this.toggleCommentModal}
            toggleCommentSection={this.toggleCommentSection}
            toggleFullScreen={this.toggleFullScreen}
          />
        );
      case 'wellplate':
        return (
          <WellplateDetails
            wellplate={el}
            showCommentModal={showCommentModal}
            showCommentSection={showCommentSection}
            comments={comments}
            section={section}
            setCommentSection={this.setCommentSection}
            getSectionComments={this.getSectionComments}
            fetchComments={this.fetchComments}
            renderCommentModal={this.renderCommentModal}
            toggleCommentModal={this.toggleCommentModal}
            toggleCommentSection={this.toggleCommentSection}
            toggleFullScreen={this.toggleFullScreen}
          />
        );
      case 'screen':
        return (
          <ScreenDetails
            screen={el}
            showCommentModal={showCommentModal}
            showCommentSection={showCommentSection}
            comments={comments}
            section={section}
            setCommentSection={this.setCommentSection}
            getSectionComments={this.getSectionComments}
            fetchComments={this.fetchComments}
            renderCommentModal={this.renderCommentModal}
            toggleCommentModal={this.toggleCommentModal}
            toggleCommentSection={this.toggleCommentSection}
            toggleFullScreen={this.toggleFullScreen}
          />
        );
      case 'deviceCtrl':
        return (
          <DeviceDetails
            device={el}
            toggleFullScreen={this.toggleFullScreen}
          />
        );
      // case 'deviceAnalysis':
      //   return <DeviceAnalysisDetails analysis={el}
      //     toggleFullScreen={this.toggleFullScreen}/>;
      case 'research_plan':
        return (
          <ResearchPlanDetails
            researchPlan={el}
            showCommentModal={showCommentModal}
            showCommentSection={showCommentSection}
            comments={comments}
            section={section}
            setCommentSection={this.setCommentSection}
            getSectionComments={this.getSectionComments}
            fetchComments={this.fetchComments}
            renderCommentModal={this.renderCommentModal}
            toggleCommentModal={this.toggleCommentModal}
            toggleCommentSection={this.toggleCommentSection}
            toggleFullScreen={this.toggleFullScreen}
          />
        );
      case 'report':
        return <ReportContainer report={el} />;
      case 'prediction':
        return <PredictionContainer prediction={el} />;
      case 'format':
        return <FormatContainer format={el} />;
      case 'graph':
        return <GraphContainer graph={el} />;
      case 'task':
        return <ComputeTaskContainer task={el} />;
      case 'literature_map':
        return <LiteratureDetails literatureMap={el} />;
      default:
        return (
          <div style={{ textAlign: 'center' }}>
            <br />
            <h1>{el.id.substring(el.id.indexOf('error:') + 6)}</h1>
            <h3><i className="fa fa-eye-slash fa-5x" /></h3>
            <Button
              bsStyle="danger"
              onClick={() => DetailActions.close(el, true)}
            >
              Close this window
            </Button>
          </div>
        );
    }
  }

  tabTitle(el, elKey) {
    const bsStyle = el.isPendingToSave ? 'info' : 'primary';
    const focusing = elKey === this.state.activeKey;

    let iconElement = (<i className={`icon-${el.type}`} />);

    const tab = tabInfoHash[el.type] || {};
    const title = tab.title || el.title();
    if (tab.iconEl) { iconElement = tab.iconEl; }
    if (el.element_klass) { iconElement = (<i className={`${el.element_klass.icon_name}`} />); }
    const icon = focusing ? (iconElement) : (<Label bsStyle={bsStyle || ''}>{iconElement}</Label>);
    return (<div>{icon} &nbsp; {title} </div>);
  }

  toggleCommentModal = (btnAction) => {
    this.setState({ showCommentModal: btnAction });
  };

  toggleCommentSection = () => {
    this.setState({ showCommentSection: !this.state.showCommentSection });
  }

  getSectionComments = (section) => {
    const { comments } = this.state;
    return comments && comments.filter(cmt => (cmt.section === section));
  }

  getAllComments = (section) => {
    const { comments } = this.state;
    return comments && comments.filter(cmt => (cmt.section !== section));
  }

  setCommentSection = (section) => {
    this.setState({ section });
  }

  fetchComments = (element) => {
    CommentFetcher.fetchByCommentableId(element.id, element.type)
      .then((comments) => {
        if (comments != null) {
          this.setState({ comments });
        }
      })
      .catch((errorMessage) => {
        console.log(errorMessage);
      });
  };

  renderCommentModal = (element) => {
    const { showCommentModal, comments, section } = this.state;
    if (showCommentModal) {
      return (
        <CommentModal
          showCommentModal={showCommentModal}
          element={element}
          section={section}
          comments={comments}
          fetchComments={this.fetchComments}
          getSectionComments={this.getSectionComments}
          toggleCommentModal={this.toggleCommentModal}
          getAllComments={this.getAllComments}
        />
      );
    }
    return <div />;
  };

  render() {
    const {
      fullScreen, selecteds, activeKey, offsetTop
    } = this.state;
    const fScrnClass = fullScreen ? 'full-screen' : 'normal-screen';

    const selectedElements = selecteds.map((el, i) => {
      if (!el) return (<span />);
      const key = `${el.type}-${el.id}`;
      return (
        <Tab
          key={key}
          eventKey={i}
          unmountOnExit
          title={this.tabTitle(el, i)}
        >
          {this.content(el)}
        </Tab>
      );
    });

    return (
      <div>
        <StickyDiv zIndex={fullScreen ? 9 : 2} offsetTop={offsetTop}>
          <div className={fScrnClass}>
            <Tabs
              id="elements-tabs"
              activeKey={activeKey}
              onSelect={DetailActions.select}
            >
              {selectedElements}
            </Tabs>
          </div>
        </StickyDiv>
      </div>
    );
  }
}
