import React, { useState, useEffect } from 'react';
import './App.css';
import { withAuthenticator, AmplifySignOut } from '@aws-amplify/ui-react';

import { graphqlOperation, API } from 'aws-amplify'
import { fridgeReadingsByDateTime } from './graphql/queries';

import moment from 'moment-timezone'

function App() {
  const [latestReading, setLatestReading] = useState([]);
  const [autoRefreshEnabled, setAutoRefresh] = useState(true);

  // Hook to run when component loads
  useEffect(() => {
    // Fetch readings on load
    fetchFridgeReadings();

    // Makes a call to fetch latest reading only if auto refresh is enabled
    function refreshIntervalHandler() {
      if (autoRefreshEnabled) {
        fetchFridgeReadings();
      }
    }

    // Set an interval to call our refresh handler ever 3000ms
    const interval = setInterval(() => refreshIntervalHandler(), 3000);

    // Clear our interval when component is closed or reloaded
    return () => {
      clearInterval(interval);
    };
    // tell component to reload when the value of auto refersh enabled is changed
  }, [autoRefreshEnabled]);

  // Makes a call to our GraphQL API to get the latest fridge reading (sorted by datetime, with limit of 1).
  async function fetchFridgeReadings() {
    // GraphQL query is auto generated by AWS Amplify all depending on the FridgeReading schema in schema.graphql file
    const resp = await API.graphql(graphqlOperation(fridgeReadingsByDateTime,
      {
        sortDirection: 'DESC',
        type: 'FridgeReading',
        limit: 1
      }));

    console.log(resp.data?.fridgeReadingsByDateTime.items);

    let reading = resp.data.fridgeReadingsByDateTime.items[0];

    // Convert our raw UTC datetime into a nice format and converted to eastern timezone
    reading.datetime = moment(reading.datetime).tz('America/New_York').format('MMMM Do YYYY, h:mm:ss A');
    
    // Update the state of our latest reading
    setLatestReading(reading);
  }

  // Set the value of auto refresh enabled when checkbox is changed
  function handleAutoRefreshChange(event) {
    setAutoRefresh(event.target.checked);
  }

  return (
    <div className="App">
      <h1>Smart Fridge</h1>
      <div style={{marginBottom: 24, display: "inline-flex"}}>
        <table>
        <tbody>
        <tr>
        <th>Temperature</th><th>Humidity</th><th>Date</th>
        </tr>
        <tr>
        <td>{latestReading?.temperature}</td><td>{latestReading?.humidity}</td><td>
          { latestReading?.datetime }</td>
        </tr>
        </tbody>
        </table>
      </div>

      <div className="buttonsDiv">
        <label className="inputLabel">
          <span className="checkboxSpan">Auto Refresh</span>
          <input
          type="checkbox"
          className="inputBox"
          onChange={handleAutoRefreshChange}
          checked={autoRefreshEnabled}>
          </input>
        </label>
      { !autoRefreshEnabled &&
        <button
          className="refreshButton"
          onClick={fetchFridgeReadings}
        >
          Refresh
        </button>
      }
      </div>

      <AmplifySignOut />
    </div>
  );
}

export default withAuthenticator(App);