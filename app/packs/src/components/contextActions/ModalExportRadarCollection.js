import React from 'react';
import {Button, ButtonToolbar} from 'react-bootstrap';
import UIStore from '../stores/UIStore';
import MetadataFetcher from '../fetchers/MetadataFetcher';
import { elementShowOrNew } from '../routesUtils'
import { subjectAreas } from '../staticDropdownOptions/radar/subjectAreas'
import { contributorTypes } from '../staticDropdownOptions/radar/contributorTypes'
import { relatedIdentifierTypes } from '../staticDropdownOptions/radar/relatedIdentifierTypes'
import { relationTypes } from '../staticDropdownOptions/radar/relationTypes'
import { controlledRightsList } from '../staticDropdownOptions/radar/controlledRightsList'
import { funderIdentifierTypes } from '../staticDropdownOptions/radar/funderIdentifierTypes'

export default class ModalExportRadarCollection extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      processing: false,
      metadata: null
    }

    this.handleEdit = this.handleEdit.bind(this)
    this.handleArchive = this.handleArchive.bind(this)
  }

  componentDidMount() {
    const { currentCollection } = UIStore.getState()

    MetadataFetcher.fetch(currentCollection.id)
      .then((result) => {
        this.setState({ metadata: result.metadata })
      }).catch((errorMessage) => {
        console.log(errorMessage);
      });
  }

  handleEdit() {
    const { onHide, editAction } = this.props;

    editAction()

    setTimeout(() => {
      this.setState({ processing: false });
      onHide();
    }, 1000);
  }

  handleArchive() {
    const { onHide, action } = this.props;
    const { currentCollection } = UIStore.getState();
    this.setState({ processing: true });

    const params = {
      collection_id: currentCollection.id
    };

    action(params);

    setTimeout(() => {
      this.setState({ processing: false });
      onHide();
    }, 1000);
  }

  renderMetadata() {
    const { metadata } = this.state

    return (
      <div>
        <dl>
          <dt>Title</dt>
          <dd>
            {metadata.title || <p className="text-danger">Please provide a title.</p>}
          </dd>
          <dt>Description</dt>
          <dd>{metadata.description}</dd>
          <dt>Subjects</dt>
          <dd>
            {
              metadata.subjectAreas ? <ul>
              {
                metadata.subjectAreas.map((subjectArea, index) => {
                  const controlledSubjectAreaName = subjectAreas.find(el => el.value == subjectArea.controlledSubjectAreaName)
                  return (
                    <li key={index}>{controlledSubjectAreaName.label}</li>
                  )
                })
              }
              </ul> : <p className="text-danger">Please provide at least one subject area.</p>
            }
          </dd>
          <dt>Keywords</dt>
          <dd>
            {
              metadata.keywords ? <ul>
              {
                metadata.keywords.map((keyword, index) => (
                  <li key={index}>{keyword}</li>
                ))
              }
              </ul> : <p>---</p>
            }
          </dd>
          <dt>Creators</dt>
          <dd>
            {
              metadata.creators ? <ul>
              {
                metadata.creators.map((creator, index) => (
                  <li key={index}>
                    {creator.givenName} {creator.familyName}
                    {creator.orcid && `, ${creator.orcid}`}
                    {creator.affiliations.length > 0 && `, ${creator.affiliations.map(
                      affiliation => affiliation.affiliation
                    ).join(', ')}`}
                  </li>
                ))
              }
              </ul> : <p className="text-danger">Please provide at least one creator.</p>
            }
          </dd>
          <dt>Contributors</dt>
          <dd>
            {
              metadata.contributors ? <ul>
              {
                metadata.contributors.map((contributor, index) => {
                  const contributorType = contributorTypes.find(el => el.value == contributor.contributorType)

                  return (
                    <li key={index}>
                      {contributor.givenName} {contributor.familyName}, {contributorType.label}
                      {contributor.orcid && `, ${contributor.orcid}`}
                      {contributor.affiliations.length > 0 && `, ${contributor.affiliations.map(
                        affiliation => affiliation.affiliation
                      ).join(', ')}`}
                    </li>
                  )
                })
              }
              </ul> : <p>---</p>
            }
          </dd>
          <dt>Releated identifiers</dt>
          <dd>
            {
              metadata.relatedIdentifiers ? <ul>
              {
                metadata.relatedIdentifiers.map((relatedIdentifier, index) => {
                  const relatedIdentifierType = relatedIdentifierTypes.find(el => el.value == relatedIdentifier.relatedIdentifierType)
                  const relationType = relationTypes.find(el => el.value == relatedIdentifier.relationType)

                  return (
                    <li key={index}>
                      {relatedIdentifier.relatedIdentifier}{', '}{relatedIdentifierType.label}{', '}{relationType.label}
                    </li>
                  )
                })
              }
              </ul> : <p>---</p>
            }
          </dd>
          <dt>Alternative identifiers</dt>
          <dd>
            {
              metadata.alternateIdentifiers ? <ul>
              {
                metadata.alternateIdentifiers.map((alternateIdentifier, index) => (
                  <li key={index}>
                    {alternateIdentifier.alternateIdentifier}{', '}{alternateIdentifier.alternateIdentifierType}
                  </li>
                ))
              }
              </ul> : <p>---</p>
            }
          </dd>
          <dt>Rights holder</dt>
          <dd>
            {
              metadata.rightsHolders ? <ul>
              {
                metadata.rightsHolders.map((rightsHolder, index) => (
                  <li key={index}>{rightsHolder}</li>
                ))
              }
              </ul> : <p className="text-danger">Please provide at least one rights holder.</p>
            }
          </dd>
          <dt>Rights</dt>
          <dd>
            {
              metadata.rights ? <ul>
              {
                metadata.rights.map((rights, index) => {
                  const controlledRights = controlledRightsList.find(el => el.value == rights.controlledRights)
                  return (
                    <li key={index}>
                      {controlledRights.label}
                      {rights.additionalRights && `, ${rights.additionalRights}`}
                    </li>
                  )
                })
              }
              </ul> : <p className="text-danger">Please provide usage rights.</p>
            }
          </dd>
          <dt>Funding references</dt>
          <dd>
            {
              metadata.fundingReferences ? <ul>
              {
                metadata.fundingReferences.map((fundingReference, index) => {
                  const funderIdentifierType = funderIdentifierTypes.find(el => el.value == fundingReference.funderIdentifierType)

                  return (
                    <li key={index}>
                      {fundingReference.funderName}
                      {fundingReference.funderIdentifier && `, ${fundingReference.funderIdentifier}`}
                      {funderIdentifierType && `, ${funderIdentifierType.label}`}
                      {fundingReference.awardTitle && `, ${fundingReference.awardTitle}`}
                      {fundingReference.awardNumber && `, ${fundingReference.awardNumber}`}
                      {fundingReference.awardURI && `, ${fundingReference.awardURI}`}
                    </li>
                  )
                })
              }
              </ul> : <p>---</p>
            }
          </dd>
        </dl>
      </div>
    )
  }

  renderButtonBar() {
    const { onHide } = this.props;
    const { processing, metadata } = this.state;
    const bStyle = processing === true ? 'danger' : 'warning';
    const bClass = processing === true ? 'fa fa-spinner fa-pulse fa-fw' : 'fa fa-file-text-o';

    let bTitle = processing === true ? 'Archiving' : 'Archive to RADAR';
    if (metadata.datasetId) {
      bTitle = processing === true ? 'Updating' : 'Update in RADAR';
    }

    return (
      <ButtonToolbar>
        <div className="pull-right">
          <ButtonToolbar>
            <Button bsStyle="primary" onClick={onHide}>Cancel</Button>
            <Button onClick={this.handleEdit}>Edit collection metadata</Button>
            <Button
              bsStyle={bStyle}
              id="md-export-dropdown"
              disabled={this.isDisabled()}
              title="Archive to RADAR"
              onClick={this.handleArchive}
            >
              <span><i className={bClass} />&nbsp;{bTitle}</span>
            </Button>
          </ButtonToolbar>
        </div>
      </ButtonToolbar>
    );
  }

  isDisabled() {
    const { processing, metadata } = this.state;
    return processing === true || metadata === null || (
      metadata.title === undefined || metadata.title.length < 1 ||
      metadata.subjectAreas === undefined || metadata.subjectAreas.length < 1 ||
      metadata.creators === undefined || metadata.creators.length < 1 ||
      metadata.rightsHolders === undefined || metadata.rightsHolders.length < 1 ||
      metadata.rights === undefined || metadata.rights.length < 1
    );
  }

  render() {
    const { full } = this.props
    const { metadata } = this.state
    const onChange = (v) => this.setState(
      previousState => {return { ...previousState, value: v }}
    )

    if (metadata) {
      return (
        <div className="export-collections-modal">
          {this.renderMetadata()}
          {this.renderButtonBar()}
        </div>
      )
    } else {
      return <p className="text-center"><i className="fa fa-refresh fa-spin fa-fw" /></p>
    }
  }
}
