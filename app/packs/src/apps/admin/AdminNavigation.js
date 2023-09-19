import React from 'react';
import { Nav, Navbar, MenuItem, NavDropdown } from 'react-bootstrap';

import UserAuth from 'src/components/navigation/UserAuth';
import UserStore from 'src/stores/alt/stores/UserStore';
import UserActions from 'src/stores/alt/actions/UserActions';

import NavNewSession from 'src/components/navigation/NavNewSession';
import DocumentHelper from 'src/utilities/DocumentHelper';
import NavHead from 'src/components/navigation/NavHead';

export default class AdminNavigation extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      currentUser: null,
    };
    this.toggleTree = this.toggleTree.bind(this);
    this.onChange = this.onChange.bind(this);
  }

  componentDidMount() {
    UserStore.listen(this.onChange);
    UserActions.fetchCurrentUser();
    UserActions.fetchUnitsSystem();
  }

  componentWillUnmount() {
    UserStore.unlisten(this.onChange);
  }

  onChange(state) {
    const newId = state.currentUser ? state.currentUser.id : null;
    const oldId = this.state.currentUser ? this.state.currentUser.id : null;
    if (newId !== oldId) { this.setState({ currentUser: state.currentUser }); }
  }

  toggleTree() {
    this.props.toggleTree();
  }

  navHeader() {
    return (
      <Navbar.Header className="collec-tree">
        <Navbar.Text style={{ cursor: 'pointer' }}>
          <i
            className="fa fa-list"
            style={{ fontStyle: "normal" }}
            onClick={this.toggleTree}
          />
        </Navbar.Text>
        <Navbar.Text />
        <NavHead />
      </Navbar.Header>
    );
  }

  render() {
    return this.state.currentUser ? (
      <Navbar fluid className="navbar-custom">
        {this.navHeader()}
        <Nav navbar className="navbar-form">
          <h1>ELN Administration</h1>
        </Nav>
        <UserAuth />
        <div style={{ clear: 'both' }} />
      </Navbar>
    ) : (
      <Navbar fluid className="navbar-custom" >
        {this.navHeader()}
        <Nav navbar className="navbar-form" />
        <div>
          <h1>ELN Administration</h1>
        </div>
        <NavNewSession authenticityToken={DocumentHelper.getMetaContent('csrf-token')} />
        <div style={{ clear: 'both' }} />
      </Navbar>
    );
  }
}
