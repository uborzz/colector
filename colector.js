let continue_token = null;
let sessionid = null;
let profileURI = null;
let tabURIparam = 'matchhistorycompetitive';
let forceStop = false
let last_loaded_page = 0

const maxRetries = 3;

function getSteamID (minProfile) {
  return '76' + (parseInt(minProfile) + 561197960265728)
}

const statusBar = document.createElement('div');
statusBar.style.margin = '8px 0';
statusBar.style.whiteSpace = 'pre-wrap';
statusBar.textContent = "Saludos dama oOoOo caballero."
const updateStatus = (text, accumulate) => {
    if (accumulate) {
        statusBar.textContent = statusBar.textContent + '\n' + text;
    } else {
        statusBar.textContent = text;
    }
}

const menu = document.createElement('div');
menu.style.padding = '0 14px';
menu.id = 'banchecker-menu';
menu.style.textAlign = 'center';

const createSteamButton = (text, iconURI) => {
    const button = document.createElement('div');
    // pullup_item class style replication using js
    // TODO: move to separate css file for sanity
    button.style.display = 'inline-block';
    button.style.backgroundColor = 'rgba( 103, 193, 245, 0.2 )';
    button.style.padding = '3px 8px 0px 0px';
    button.style.borderRadius = '2px';
    button.style.marginRight = '6px';
    button.style.cursor = 'pointer';
    button.style.lineHeight = '18px';
    button.style.color = '#66c0f4';
    button.style.fontSize = '11px';
    button.onmouseover = () => {
        button.style.backgroundColor = 'rgba( 102, 192, 244, 0.4 )';
        button.style.color = '#ffffff';
    }
    button.onmouseout = () => {
        button.style.backgroundColor = 'rgba( 103, 193, 245, 0.2 )';
        button.style.color = '#66c0f4';
    }
    const iconEl = document.createElement('div');
    iconEl.className = 'menu_ico';
    iconEl.style.display = 'inline-block';
    iconEl.style.verticalAlign = 'top';
    iconEl.style.padding = iconURI ? '1px 7px 0 6px' : '1px 8px 0 0';
    iconEl.style.minHeight = '22px';
    if (iconURI) {
        const image = document.createElement('img');
        image.src = iconURI;
        image.width = '16';
        image.height = '16';
        image.border = '0';
        iconEl.appendChild(image);
    }
    button.appendChild(iconEl);
    const textNode = document.createTextNode(text);
    button.appendChild(textNode);
    return button;
}

const fetchButton = createSteamButton('Load whole match history');
fetchButton.onclick = (event) => {
    console.log("calling fetchMatchHistory...");
    fetchButton.style.disabled = true
    fetchButton.style.backgroundColor = 'rgba( 200, 200, 200, 0.5 )';
    fetchButton.onmouseover = () => {}
    fetchButton.onmouseout = () => {}
    forceStop = false
    fetchMatchHistory();
    fetchButton.onclick = () => {
        updateStatus('This button was already pressed. Reload the page if you want to start over.');
    }
}

const stopButton = createSteamButton('Stop scanning');
stopButton.onclick = () => {
    console.log("stopping...")
    fetchButton.disabled = false
    fetchButton.style.backgroundColor = 'rgba( 103, 193, 245, 0.2 )'
    // fetchButton.textContent = 'Load moar games'
    fetchButton.childNodes[1].nodeValue = 'Load moar games'  // el nodo de texto del div fetchButton
    fetchButton.onmouseover = () => {
      fetchButton.style.backgroundColor = 'rgba( 102, 192, 244, 0.4 )';
      fetchButton.style.color = '#ffffff';
    }
    fetchButton.onmouseout = () => {
      fetchButton.style.backgroundColor = 'rgba( 103, 193, 245, 0.2 )';
      fetchButton.style.color = '#66c0f4';
    }
    fetchButton.onclick = (event) => {
      console.log("calling fetchMatchHistory...");
      fetchButton.style.disabled = true
      fetchButton.style.backgroundColor = 'rgba( 200, 200, 200, 0.5 )';
      fetchButton.onmouseover = () => {}
      fetchButton.onmouseout = () => {}
      forceStop = false
      fetchMatchHistory(started=true);
      fetchButton.onclick = () => {
          updateStatus('This button was already pressed. Reload the page if you want to start over.');
      }
  }
    forceStop = true
}

const extractDataFromHtml = () => {
  // Current Steam USER
    let script_text = $( "script:contains('g_steamID')" )[0].text
    let script_line = script_text.match(/g_steamID(.*?);/g)[0]
    let steam_id = script_line.match(/[0-9]+/g)[0]
    console.log("Steam ID:", steam_id)

  // Matches
  let competitive_matches = []
  let panels_left = $("table.csgo_scoreboard_inner_left")
  let panels_right = $("table.csgo_scoreboard_inner_right")
  console.log("Size panels", panels_left.length, panels_right.length)
  var i, j
  var info_left, info_right
  // Left Panel
  for (i = 0; i < panels_left.length; i++) { 
    var match_left = []
    var match_right = []
    info_left = $("table.csgo_scoreboard_inner_left").last().find("tr > td").not(".csgo_scoreboard_cell_noborder")
    match_left['map'] = $.trim(info_left[0].textContent).replace("Competitive ", "")
    match_left['datetime'] = $.trim(info_left[1].textContent).replace(" GMT", "").replace(" ", "T")+"Z"
    match_left['wait_time'] = $.trim(info_left[2].textContent).replace("Wait Time: ", "")
    match_left['duration'] = $.trim(info_left[3].textContent).replace("Match Duration: ", "")
    match_left['replay_url'] = $("table.csgo_scoreboard_inner_left").last().find("tr > td.csgo_scoreboard_cell_noborder").find("a")[0].href
    $("table.csgo_scoreboard_inner_left").last().remove()
    console.log(match_left)
  // Right Panel
  } 
}

const sendButton = createSteamButton('Send to uborzz page');
sendButton.onclick = () => {
    console.log("calling sendToServer...");
    sendToServer()
}

menu.appendChild(statusBar);
menu.appendChild(fetchButton);
menu.appendChild(stopButton);
menu.appendChild(sendButton);
document.querySelector('#subtabs').style.height = "15px"
document.querySelector('#subtabs').insertAdjacentElement('afterend', menu);


const sendToServer = () => {
  console.log("sendToServer method called")
  extractDataFromHtml()
}


const fetchMatchHistoryPage = (recursively, page, retryCount) => {
  document.querySelector('#load_more_button').style.display = 'none';
  document.querySelector('#inventory_history_loading').style.display = 'block';
  fetch (`${profileURI}gcpd/730?ajax=1&tab=${tabURIparam}&continue_token=${continue_token}&sessionid=${sessionid}`,
      {
          credentials: "include"
      })
  .then(res => {
      if (res.ok) {
          const contentType = res.headers.get("content-type");
          if (contentType && contentType.indexOf("application/json") !== -1) {
              return res.json();
          } else {
              return res.text();
          }
      } else {
          throw Error(`Code ${res.status}. ${res.statusText}`);
      }
  })
  .then(json => {
      if (!json.success) {
          throw Error('error getting valid JSON in response to\n' +
                      `${profileURI}gcpd/730?ajax=1&tab=${tabURIparam}&continue_token=${continue_token}&sessionid=${sessionid}`);
      }
      if (json.continue_token) {
          continue_token = json.continue_token;
      } else {
          updateStatus('No continue_token returned from Steam, looks like there are no more matches to load!');
          continue_token = null;
      }
      const parser = new DOMParser(); // todo: don't create new parser for each request
      const newData = parser.parseFromString(json.html, 'text/html');
      let elementsToAppend = '.csgo_scoreboard_root > tbody > tr';
      let elementToAppendTo = '.csgo_scoreboard_root';
      if (tabURIparam === 'playerreports' || tabURIparam === 'playercommends') {
          elementsToAppend = 'tbody > tr';
          elementToAppendTo = '.generic_kv_table tbody';
      }
      newData.querySelectorAll(elementsToAppend).forEach((tr, i) => {
          if (i > 0) document.querySelector(elementToAppendTo).appendChild(tr);
      })
      if (forceStop) {
        updateStatus('Stopped. ' + page + ' pages loaded. About ' + page*8 + ' games.');
        console.log("forceStop with value true.")
        document.querySelector('#load_more_button').style.display = 'inline-block';
        document.querySelector('#inventory_history_loading').style.display = 'none';
      } else {
        if (recursively && continue_token) {
            updateStatus(`Loaded ${page ? page + 1 : 1} page${page ? 's' : ''}...`);
            last_loaded_page = page
            fetchMatchHistoryPage(true, page ? page + 1 : 1, maxRetries);
        } else {
            updateStatus('Done. ' + page + ' pages loaded. About ' + page * 8 + ' games.');
            if (!continue_token) {
                document.querySelector('#inventory_history_loading').style.display = 'none';
            } else {
                document.querySelector('#load_more_button').style.display = 'inline-block';
                document.querySelector('#inventory_history_loading').style.display = 'none';
            }
        }
      }
  })
  .catch((error) => {
      updateStatus(`Error while loading match history:\n${error}` +
                   `${retryCount !== undefined && retryCount > 0 ? `\n\nRetrying to fetch page... ${maxRetries - retryCount}/3`
                                                                 : `\n\nCouldn't load data after ${maxRetries} retries :(`}`);
      if (retryCount > 0) {
          setTimeout(() => fetchMatchHistoryPage(true, page, retryCount - 1), 3000);
      }
      document.querySelector('#load_more_button').style.display = 'inline-block';
      document.querySelector('#inventory_history_loading').style.display = 'none';
  })
}

const fetchMatchHistory = (started=false) => {
  if (continue_token && sessionid && profileURI) {
      console.log(`First continue token: ${continue_token} | SessionID: ${sessionid} | Profile: ${profileURI}`);
      updateStatus('Loading Match history...');
      if (started){
        fetchMatchHistoryPage(true, last_loaded_page, maxRetries);
      } else {
        fetchMatchHistoryPage(true, 1, maxRetries);
      }
  }
}

const profileAnchor = document.querySelector('#global_actions .user_avatar');
if (!profileAnchor) {
    updateStatus('Error: .user_avatar element was not found');
    console.log('Error: .user_avatar element was not found')
}
profileURI = profileAnchor.href;
if (!document.querySelector('#load_more_button')) {
    updateStatus('No "LOAD MORE HISTORY" button is present, seems like there are no more matches');
}
const steamContinueScript = document.querySelector('#personaldata_elements_container+script');
const matchContinueToken = steamContinueScript.text.match(/g_sGcContinueToken = '(\d+)'/);
if (!matchContinueToken) {
    updateStatus('Error: g_sGcContinueToken was not found');
}
continue_token = matchContinueToken[1];
    const steamSessionScript = document.querySelector('#global_header+script');
    const matchSessionID = steamSessionScript.text.match(/g_sessionID = "(.+)"/);
    if (!matchSessionID) {
        updateStatus('Error: g_sessionID was not found');
    }
sessionid = matchSessionID[1];

console.log("session", sessionid)
console.log("token", continue_token)
