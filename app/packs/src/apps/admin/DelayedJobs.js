import { Button, OverlayTrigger, Table, Tooltip } from 'react-bootstrap';
import React, { Component } from 'react';
import AdminFetcher from 'src/fetchers/AdminFetcher';

const tipRestartJob = <Tooltip id="restart_tooltip">Update run_at</Tooltip>;

export default class DelayedJobs extends Component {
  constructor(props) {
    super(props);
    this.state = {
      jobs: [],
    };
    this.handleFetchJob = this.handleFetchJob.bind(this);
  }

  componentDidMount() {
    this.handleFetchJob();
  }

  handleFetchJob() {
    AdminFetcher.fetchJobs()
      .then((result) => {
        this.setState({
          jobs: result.jobs,
        });
      });
  }

  handleRestartFetch(id) {
    AdminFetcher.restartJob({ id })
      .then(() => this.handleFetchJob());
  }

  renderShowBtn(job) {
    if (true) {
      return (
        <OverlayTrigger placement="top" overlay={tipRestartJob}>
          <Button
            size="sm"
            variant="success"
            onClick={() => this.handleRestartFetch(job.id)}
          >
            <i className="fa fa-play" aria-hidden="true" />
          </Button>
        </OverlayTrigger>);
    }
  }

  render() {
    const { jobs } = this.state;

    const tcolumn = (
      <tr className="align-middle">
        <th className="w-4 fs-4" colSpan="2">ID</th>
        <th className="w-5 fs-4">Queue</th>
        <th className="w-5 fs-4">Job Class</th>
        <th className="w-5 fs-4">Run At</th>
        <th className="w-5 fs-4">Failed At</th>
        <th className="w-4 fs-4">Attempts</th>
        <th className="w-4 fs-4">Priority</th>
        <th className="w-50 fs-4">Last Errors</th>
      </tr>
    );

    const tbody = jobs.map(job => (
      <tr key={`row_${job.id}`} className="align-middle">
        <td> {job.id} </td>
        <td> {this.renderShowBtn(job)} </td>
        <td> {job.queue} </td>
        <td> {job.handler.split(' ')[4].trim()} </td>
        <td> {job.run_at} </td>
        <td> {job.failed_at} </td>
        <td> {job.attempts} </td>
        <td> {job.priority} </td>
        <td><textarea defaultValue={job.last_error} mw-100 /></td>
      </tr>
    ));

    return (
      <div>
        <h3 className='bg-light p-3 rounded'>Delayed Jobs</h3>
        <Table responsive hover bordered>
          <thead>
            {tcolumn}
          </thead>
          <tbody>
            {tbody}
          </tbody>
        </Table>
      </div>
    );
  }
}
