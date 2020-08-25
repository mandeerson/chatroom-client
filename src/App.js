import React, { Component } from 'react';
import Identicon from 'react-identicons';
import { UncontrolledTooltip } from 'reactstrap';
import Editor from 'react-medium-editor';
import moment from 'moment';
import 'medium-editor/dist/css/medium-editor.css';
import 'medium-editor/dist/css/themes/default.css';
import './App.css';
import './Login.css';
import './Editor.css';

var client = null;
const defaultMessage = "Start writing your document here";

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      users: [],
      activity: [],
      username: null,
      text: ''
    };
  }

  logInUser = () => {
    const username = this.username.value;
    if (username.trim()) {
      const data = {
        username
      };
      this.setState({
        ...data
      }, () => { 
        client.send("/app/join", {}, JSON.stringify({
          ...data
        }));
      });
    }
  }

  onEditorStateChange = (text) => {
    client.send("/app/colaborate", {}, JSON.stringify({
      content: text
    }));
  };

  onConnected = () => {
      console.log('WebSocket Client Connected');
      client.subscribe('/topic/response', this.onMessageReceived); 
  }

  onError = (error) => {
    console.log('Error to connect ', error);
  }
  onMessageReceived = (payload) => { 
      console.log('Received ', payload.body);
      const message = JSON.parse(payload.body);

      const stateToChange = {}; 
      stateToChange.users = Object.values(message.users);
      stateToChange.text = message.content || defaultMessage; 
      stateToChange.activity = message.activity;

      this.setState({
        ...stateToChange
      });
  }

  componentWillMount() {
      const Stomp = require('stompjs')
      var SockJS = require('sockjs-client')
      SockJS = new SockJS('http://192.168.0.111:8080/ws')
      client = Stomp.over(SockJS);

      client.connect({}, this.onConnected, this.onError); 
  }

  showLoginSection = () => [
    <div class="header">
      <img class="logo" src={"/logo.png"} alt="logo"/>
    </div>,
    <div className="login">
        <input type="text" name="username" placeholder="Username" ref={(input) => { this.username = input; }} />
        <button type="button" onClick={() => this.logInUser()}>Join</button> 
    </div>
  ]

  showEditorSection = () => (
    <div className="content">
      <div className="document">
        <div className="users">
          {this.state.users.map(user => (
            <React.Fragment key={user.username}>
              <span id={user.username} className="info" key={user.username}>
                <Identicon className="account__avatar" style={{ backgroundColor: user.randomcolor }} size={40} string={user.username} />
              </span>
              <UncontrolledTooltip placement="top" target={user.username}>
                {user.username}
              </UncontrolledTooltip>
            </React.Fragment>
          ))}
        </div>
        <Editor
          options={{
            placeholder: {
              text: this.state.text ? defaultMessage : ""
            }
          }}
          className="editor"
          text={this.state.text}
          onChange={this.onEditorStateChange}
        />
      </div>
      <div className="activity">
        <ul>
          {this.state.activity.map((activity, index) => this.renderUserActivity(activity, index))}
        </ul>
      </div>
    </div>
  )

  renderUserActivityType(activity) { 
    return (
        <React.Fragment key={activity.date}>
          {activity.type === 'JOIN' ? 'Joined' : 'Leave'}
        </React.Fragment>
      );
  }

  renderUserActivity(activity, index) {
    return (
        <React.Fragment key={index}>
          <li key={`activity-${index}`}>{moment(activity.date).fromNow()} : {activity.user.username} {this.renderUserActivityType(activity)}</li>
        </React.Fragment>
      );
  }
 
  render() {
    const {
      username
    } = this.state;
    return (
      <React.Fragment>
        <div className="body">
          {username ? this.showEditorSection() : this.showLoginSection()}
        </div>
      </React.Fragment>
    );
  }
}

export default App;