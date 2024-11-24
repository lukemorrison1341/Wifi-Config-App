import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [login_toggle, set_login_toggle] = useState(false);
  const [dots, set_dots] = useState('');
  const [fail_connect, fail_connect_toggle] = useState(false);
  const [ssid, setSsid] = useState(''); // State for SSID
  const [password, setPassword] = useState(''); // State for Password
  const [login_timer, set_login_timer] = useState(2); // Timer state (5 seconds)
  const [retry_count, set_retry_count] = useState(0); // Retry count
  const [success_status, set_success_status] = useState(true);

  const MAX_RETRIES = 3; // Max number of retries before showing "Failed to connect"
  const FETCH_TIMEOUT = 2000; // Timeout in milliseconds (2 seconds)

  const toggleLogin = () => {
    set_login_toggle(true); // Start the login process
    set_success_status(false);
    fail_connect_toggle(false); // Reset failure state
    set_retry_count(0); // Reset retries
    set_login_timer(2); // Reset timer
    tryToConnect(); // Start the first connection attempt
  };

  const tryToConnect = async () => {
  console.log(`Attempting connection, retry count: ${retry_count}`);
  
  // Custom fetch function with timeout
  const fetchWithTimeout = (url, options, timeout) => {
    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      const signal = controller.signal;
      const timeoutId = setTimeout(() => {
        controller.abort();
        reject(new Error("Request timed out")); // Explicit rejection on timeout
      }, timeout);

      fetch(url, { ...options, signal })
        .then((response) => {
          clearTimeout(timeoutId); // Clear timeout if fetch succeeds
          resolve(response);
        })
        .catch((error) => {
          clearTimeout(timeoutId); // Clear timeout if fetch fails
          reject(error);
        });
    });
  };

  try {
    const response = await fetchWithTimeout('http://192.168.4.1/wifi-setup', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ssid, password }), // Send SSID and Password as JSON
    }, FETCH_TIMEOUT);

    if (!response.ok) {
      throw new Error('Failed to connect');
    }

    const data = await response.json();
    console.log('Response from ESP32:', data);
    //HEERE - ONLY DISPLAY SUCCESS IF RECEIVED JSON PACKAGE SAYS IT COULD LOG IN

    if(data.status == "success"){
        set_success_status(true);
    }
    else if(data.status == "fail"){
      set_success_status(false);
      fail_connect_toggle(true);
    }
    //alert('Connected successfully!'); // Show success message
    set_login_toggle(false); // Stop the login process
  } catch (error) {
    if (error.message === 'Request timed out') {
      console.error('Fetch request timed out.');
    } else {
      console.error('Error connecting to ESP32:', error);
    }
    handleRetry(); // Handle retry after failure or timeout
  }
};


  const handleRetry = () => {
    if (retry_count < MAX_RETRIES) {
      set_retry_count((prev) => {
        const newCount = prev + 1;
        console.log(`Retrying connection, retry count: ${newCount}`);
        return newCount;
      });
  
      setTimeout(() => {
        set_login_timer(2); // Reset timer for the next attempt
        tryToConnect(); // Retry connection after a delay
      }, 2000); // 2-second delay before retrying
    } else {
      fail_to_connect(); // Show failure message after max retries
    }
  };
  

  const fail_to_connect = () => {
    set_success_status(false);
    set_login_toggle(false); // Stop the login process
    fail_connect_toggle(true); // Show "Failed to connect" message
  };

  useEffect(() => {
    let dotsInterval;
    let timerInterval;

    if (login_toggle) {
      // Start dots animation
      dotsInterval = setInterval(() => {
        set_dots((prev) => (prev.length < 3 ? prev + '.' : ''));
      }, 500);

      // Start countdown timer
      timerInterval = setInterval(() => {
        set_login_timer((prev) => {
          if (prev > 0) return prev - 1;
          clearInterval(timerInterval); // Stop timer when it reaches 0
          return prev;
        });
      }, 1000); // Decrease timer every second
    }

    return () => {
      clearInterval(dotsInterval);
      clearInterval(timerInterval);
    };
  }, [login_toggle]); // Restart effects when login_toggle changes

  return (
    <div className='container-top'>
      
        {!login_toggle && <div className='container-login_section'>
        <div className='login_button'><button onClick={toggleLogin}>
      Login
      </button></div>
        <div className='ucf_container'>
        <img src="/UCF.png" alt="Logo"/> 
      </div>
          <h1 className="ssid_text">SSID</h1>
          <h1 className="password_text">Password</h1>
          {
            fail_connect && <h1 className='fail_connect_text' style={{ width: '500px' }}>Failed to connect!! Please re-try a valid SSID and Password for an available WiFi Network.</h1>
          }
        
      { <form>
          <input
            type="text"
            placeholder="Enter SSID"
            onChange={(e) => setSsid(e.target.value)}
            style={{ marginBottom: '10px', padding: '8px', width: '200px' }}
          />
        <input
          type="password"
          placeholder="Enter password"
          onChange={(e) => setPassword(e.target.value)}
          style={{ marginBottom: '10px', padding: '8px', width: '200px' }}
        />
      </form>
      }
      
      </div>
      }
      
      {login_toggle && <div className='login_text'>
            <h1>Logging in{dots}</h1></div>}
      <div className='vista_text'><h1>Vista Login</h1></div>

      {success_status && <div className='success_connect_text'>Connected successfully! Please connect to the WiFi network to use your VISTA device.</div>}
      
    </div>
  );
}

export default App;
