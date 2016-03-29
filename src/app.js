// vim: sts=2:sw=2:et

/**
 * Components
 */

var App = React.createClass({
  render: function() {
    var content;
    if (this.props.isFetchingData) {
      content = (
        <div className="col-md-10 loader">
          <p className="text-muted">Chargement des données…</p>
          <div className="loader-inner ball-scale-ripple-multiple">
            <div></div>
            <div></div>
            <div></div>
          </div>
        </div>
      );
    } else {
      content = (
        <div>
          <div className="col-md-5">
            <SessionFilters
              numberSessionsToShow={this.props.sessions.length}
              filter_favorites_only={this.props.filter_favorites_only}
              setFilterFavoriteOnly={this.props.setFilterFavoriteOnly}
              setFilterTitle={this.props.setFilterTitle}
            />
            <SessionList
              currentSession={this.props.currentSession}
              favoriteSessions={this.props.favoriteSessions}
              sessions={this.props.sessions}
              setCurrentSession={this.props.setCurrentSession}
            />
          </div>
          <div className="col-md-5">
            <SessionDetails
              session={this.props.currentSession}
              addFavoriteSession={this.props.addFavoriteSession}
              removeFavoriteSession={this.props.removeFavoriteSession}
              isFavorite={this.props.currentSession !== null && this.props.favoriteSessions.indexOf(this.props.currentSession.idSession) !== -1}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="mixit-app">
        <nav className="navbar navbar-dark bg-primary">
          <a className="navbar-brand" href="index.html">Mix-IT App</a>
          <ul className="nav navbar-nav">
            <li className="nav-item">
              <a className="nav-link" href="http://www.mix-it.fr/">
                <span className="fa fa-globe" /> Site du Mix-IT
              </a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="https://github.com/marienfressinaud/mixit-app">
                <span className="fa fa-github" /> Code source de l’app
              </a>
            </li>
          </ul>
        </nav>
        <div className="container-fluid">
          <div className="row">
            <div className="col-md-2">
              <ul className="nav nav-pills nav-stacked">
                <li className="nav-item">
                  <a className="nav-link active" href="#">Conférences</a>
                </li>
              </ul>
              <p className="tip">
                <span className="fa fa-question-circle" /> Conseil : utilisez les flèches ou <kbd>j</kbd>/<kbd>k</kbd> pour naviguer dans les conférences. Marquez la conférence sélectionnée avec <kbd>f</kbd> pour la trouver plus facilement. <kbd>r t</kbd> pour filtrer sur les titres, <kbd>r f</kbd> pour filtrer les favoris.
              </p>
            </div>

            {content}
          </div>
        </div>
      </div>
    );
  }
});

App = ReactRedux.connect(
  (state) => {
    return {
      isFetchingData: state.isFetchingData,
      currentSession: state.currentSession,
      favoriteSessions: state.favoriteSessions,
      filter_favorites_only: state.filters.favorites_only,
      sessions: sessionsSelector(state),
    };
  },

  (dispatch) => {
    return {
      setCurrentSession: (session) => dispatch({
        type: 'SET_CURRENT_SESSION',
        session,
      }),
      addFavoriteSession: (idSession) => dispatch(addFavoriteSession(idSession)),
      removeFavoriteSession: (idSession) => dispatch(removeFavoriteSession(idSession)),
      setFilterFavoriteOnly: (value) => dispatch({
        type: 'SET_FILTER_FAVORITE_ONLY',
        value,
      }),
      setFilterTitle: (value) => dispatch({
        type: 'SET_FILTER_TITLE',
        value,
      }),
    }
  }
)(App);

const SessionFilters = React.createClass({
  render: function() {
    var filterFavoriteClass = "fa";
    if (this.props.filter_favorites_only) {
      filterFavoriteClass += " fa-star"
    } else {
      filterFavoriteClass += " fa-star-o"
    }

    return (
      <div className="row filters">
        <div className="col-md-6">
          <form onSubmit={(e) => { e.preventDefault(); this.refs.filterTitle.blur(); Mousetrap.trigger('j'); }}>
            <input
              type="search"
              className="form-control filter-session-title"
              placeholder="Filtrer sur les titres…"
              ref="filterTitle"
              onChange={() => { this.props.setFilterTitle(this.refs.filterTitle.value)}}
            />
          </form>
        </div>
        <div className="col-md-4">
          <a
            href="#"
            className="btn filter-session-favorite"
            onClick={(e) => { e.preventDefault(); this.props.setFilterFavoriteOnly(!this.props.filter_favorites_only); }}
          >
            <span className={filterFavoriteClass} /> Filtrer les favoris
          </a>
        </div>
        <div className="col-md-2 text-xs-right">
          {this.props.numberSessionsToShow}&nbsp;résultat{this.props.numberSessionsToShow > 1 ? 's' : ''}
        </div>
      </div>
    );
  }
});

const SessionList = React.createClass({
  sessionNodes: function() {
    return this.props.sessions.map((session) => {
      var label;
      if (session.start !== null && session.end !== null && session.room !== null) {
        var startDate = moment(session.start);
        var endDate = moment(session.end);
        label = (
          <span className="label label-default label-pill pull-xs-right">
            <span className="session-room-date">{session.room} : {startDate.format('dddd Do')}</span>
            <span className="session-hours">{startDate.format('hh:mm')} → {endDate.format('hh:mm')}</span>
          </span>
        );
      }

      var sessionClass = "list-group-item";
      if (this.props.currentSession !== null && session.idSession === this.props.currentSession.idSession) {
        sessionClass += " active";
      }
      if (this.props.favoriteSessions.indexOf(session.idSession) !== -1) {
        sessionClass += " session-favorite";
      }

      return (
        <a onClick={(e) => { e.preventDefault(); this.props.setCurrentSession(session) }}
           href="#"
           className={sessionClass}
           key={session.idSession}
        >
          {label}
          {session.title}
        </a>
      );
    });
  },

  render: function() {
    if (this.props.sessions.length <= 0) {
      return (
        <div className="alert alert-warning">
          Aucune conférence ne correspond à votre recherche.
        </div>
      )
    }

    return (
      <div className="list-group session-list">
        {this.sessionNodes()}
      </div>
    )
  }
});

const SessionDetails = React.createClass({
  speakersNode: function() {
    return this.props.session.speakers.map((speaker) => {
      return (
        <li className="speaker">
          {speaker.firstname} {speaker.lastname}
        </li>
      );
    });
  },

  favoriteNode: function() {
    if (this.props.isFavorite) {
      return (
        <li className="session-popularity-item session-favorite">
          <a onClick={(e) => { e.preventDefault(); this.props.removeFavoriteSession(this.props.session.idSession) }}
             href="#"
          >
            <span className="fa fa-star" /> Cette conférence vous intéresse !
          </a>
        </li>
      );
    }

    return (
      <li className="session-popularity-item session-not-favorite">
        <a onClick={(e) => { e.preventDefault(); this.props.addFavoriteSession(this.props.session.idSession) }}
           href="#"
        >
          <span className="fa fa-star-o" /> Marquer cette conférence
        </a>
      </li>
    );
  },

  render: function() {
    if (this.props.session === null) {
      return (
        <div className="alert alert-info">
          Sélectionnez une conférence
        </div>
      )
    }

    var markdownSummary = {
      __html: marked(this.props.session.summary, { sanitize: true })
    };
    var markdownDescription = {
      __html: marked(this.props.session.description, { sanitize: true })
    };

    return (
      <div>
        <h1>{this.props.session.title}</h1>

        <ul className="speaker-list">
          {this.speakersNode()}
        </ul>

        <ul className="session-popularity">
          <li className="session-popularity-item session-consultations">
            {this.props.session.nbConsults} <span className="fa fa-eye" />
          </li>
          <li className="session-popularity-item session-votes">
            {this.props.session.positiveVotes} <span className="fa fa-thumbs-up" />
          </li>
          {this.favoriteNode()}
        </ul>

        <hr />
        <div className="lead" dangerouslySetInnerHTML={markdownSummary} />
        <hr />

        <div dangerouslySetInnerHTML={markdownDescription} />
      </div>
    );
  }
});

/**
 * API fetching
 */

function fetchData(dispatch) {
  $.ajax({
    url: 'http://yuzu.ovh/session.json',
    dataType: 'json',
    cache: false,
    beforeSend: () => dispatch({ type: 'START_FETCH_DATA' }),
    success: (data) => dispatch({
      type: 'RECEIVE_DATA',
      data
    }),
    error: (xhr, status, err) => alert('Failure', status, err.toString()),
    complete: () => dispatch({ type: 'FINISH_FETCH_DATA' }),
  });
}

function addFavoriteSession(idSession) {
  return function(dispatch, getState) {
    dispatch({
      type: 'ADD_FAVORITE_SESSION',
      idSession: idSession,
    });

    var state = getState();
    localStorage.setItem('favoriteSessions', JSON.stringify(state.favoriteSessions));
  };
}
function removeFavoriteSession(idSession) {
  return function(dispatch, getState) {
    dispatch({
      type: 'REMOVE_FAVORITE_SESSION',
      idSession: idSession,
    });

    var state = getState();
    localStorage.setItem('favoriteSessions', JSON.stringify(state.favoriteSessions));
  };
}

/**
 * Reducers
 */

const appReducer = Redux.combineReducers({
  sessions: (state = [], action) => {
    if (action.type == 'RECEIVE_DATA') {
      return action.data;
    }
    return state;
  },

  isFetchingData: (state = false, action) => {
    if (action.type == 'START_FETCH_DATA') {
      return true;
    } else if(action.type == 'FINISH_FETCH_DATA') {
      return false;
    }
    return state;
  },

  currentSession: (state = null, action) => {
    if (action.type == 'SET_CURRENT_SESSION') {
      return action.session;
    }
    return state;
  },

  favoriteSessions: (state = [], action) => {
    if (action.type == 'ADD_FAVORITE_SESSION') {
      return [
        ...state,
        action.idSession
      ];
    } else if (action.type == 'REMOVE_FAVORITE_SESSION') {
      var sessionIndex = state.indexOf(action.idSession);
      return [
        ...state.slice(0, sessionIndex),
        ...state.slice(sessionIndex + 1)
      ]
    } else if (action.type == 'SETUP_FAVORITE_SESSIONS') {
      return action.idSessions;
    }
    return state;
  },

  filters: (state = { favorites_only: false }, action) => {
    return {
      favorites_only: (state = false, action) => {
        if (action.type == 'SET_FILTER_FAVORITE_ONLY') {
          return action.value;
        }
        return state;
      }(state.favorites_only, action),
      title: (state = '', action) => {
        if (action.type == 'SET_FILTER_TITLE') {
          return action.value;
        }
        return state;
      }(state.title, action),
    };
  },
});

/**
 * Selector
 */

function sessionsSelector(state) {
  var sessions = state.sessions;
  if (state.filters.favorites_only || state.filters.title !== '') {
    sessions = sessions.filter((session) => {
      if (state.filters.title !== '' && !session.title.toLowerCase().contains(state.filters.title.toLowerCase())) {
        return false;
      }
      return !state.filters.favorites_only || state.favoriteSessions.indexOf(session.idSession) !== -1;
    });
  }

  sessions.sort((session1, session2) => {
    if (session1.start === null && session2.start === null) { return session1.idSession - session2.idSession; }
    if (session1.start === null) { return 1; }
    if (session2.start === null) { return -1; }

    var session1Date = moment(session1.start);
    if (session1Date.isAfter(session2.start)) {
      return 1;
    }
    if (session1Date.isBefore(session2.start)) {
      return -1;
    }

    return session1.idSession - session2.idSession;
  });

  return sessions;
}

/**
 * Configure store
 */

function thunkMiddleware({ dispatch, getState }) {
  return next => action =>
    typeof action === 'function' ?
      action(dispatch, getState) :
      next(action);
}

const createStoreWithMiddleware = Redux.applyMiddleware(
  thunkMiddleware
)(Redux.createStore);
const store = createStoreWithMiddleware(appReducer);

var favoriteSessionsStored = JSON.parse(localStorage.getItem('favoriteSessions'));
if (favoriteSessionsStored !== null) {
  store.dispatch({
    type: 'SETUP_FAVORITE_SESSIONS',
    idSessions: favoriteSessionsStored,
  });
}
store.dispatch(fetchData);

const Provider = ReactRedux.Provider;
ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('app')
);

/**
 * Shortcuts
 */
Mousetrap.bind('f', function() {
  var state = store.getState();
  var currentSession = state.currentSession;
  var favoriteSessions = state.favoriteSessions;

  if (currentSession === null) {
    return;
  }

  if (favoriteSessions.indexOf(currentSession.idSession) !== -1) {
    store.dispatch(removeFavoriteSession(currentSession.idSession));
  } else {
    store.dispatch(addFavoriteSession(currentSession.idSession));
  }
});

function foundNextSession(sessions, currentSession) {
  var sessionFound = false;
  for (var i = 0; i < sessions.length; i++) {
    var session = sessions[i];
    if (sessionFound) {
      return session;
    }
    if (session.idSession === currentSession.idSession) {
      sessionFound = true;
    }
  }
  return sessions[0];
}

Mousetrap.bind(['j', 'down', 'enter'], function() {
  var state = store.getState();
  var currentSession = state.currentSession;
  var sessions = sessionsSelector(state);
  if (sessions.length <= 0) {
    return;
  }

  var nextSession;
  if (currentSession === null) {
    nextSession = sessions[0];
  } else {
    nextSession = foundNextSession(sessions, currentSession);
  }

  store.dispatch({
    type: 'SET_CURRENT_SESSION',
    session: nextSession,
  });

  return false;
});

function foundPreviousSession(sessions, currentSession) {
  var previousSession = null;
  for (var i = 0; i < sessions.length; i++) {
    var session = sessions[i];
    if (previousSession !== null && session.idSession === currentSession.idSession) {
      return previousSession;
    }
    previousSession = session;
  }
  return sessions[sessions.length - 1];
}

Mousetrap.bind(['k', 'up'], function() {
  var state = store.getState();
  var currentSession = state.currentSession;
  var sessions = sessionsSelector(state);
  if (sessions.length <= 0) {
    return;
  }

  var previousSession;
  if (currentSession === null) {
    previousSession = sessions[sessions.length - 1];
  } else {
    previousSession = foundPreviousSession(sessions, currentSession);
  }

  store.dispatch({
    type: 'SET_CURRENT_SESSION',
    session: previousSession,
  });

  return false;
});

Mousetrap.bind('r f', function() {
  $('.filter-session-favorite')[0].click();
});
Mousetrap.bind('r t', function() {
  $('.filter-session-title')[0].focus();
});
