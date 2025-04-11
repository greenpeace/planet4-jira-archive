const API_URL_PREFIX = 'https://storage.googleapis.com/planet4-jira-archive/';
const HOME_API_URL = 'https://storage.googleapis.com/planet4-jira-archive/tickets.json';
// Use those two line below instead when doing local development.
// const API_URL_PREFIX = '../tickets/';
// const HOME_API_URL = '../tickets.json';
const msg = document.getElementById('msg');
const linkPattern = /([A-Z]+-\d+)/g;

function convertJiraDesc(text) {
  // Regular expression to match Jira issue keys like PROJECTKEY-123
  const issueKeyPattern = /([A-Z]+-\d+)/g;

  // Replace Jira issue keys with HTML links
  text = text.replace(issueKeyPattern, function(match) {
    const jiraUrl = `?key=${match}`;
    return `<a href="${jiraUrl}" target="_blank">${match}</a>`;
  });

  // Regular expression to match user mentions in brackets like [~username]
  const userMentionPattern = /\[~([A-Za-z0-9_]+)\]/g;

  // Replace user mentions with a span and apply a different color
  text = text.replace(userMentionPattern, function(match, username) {
    return `<span style="color: #0077cc;">~${username}</span>`;
  });

  // Regular expression to match markdown-style links [link|http://url] or [http://url]
  const markdownLinkPattern = /\[([^\|]+)\|([^\]]+)\]|\[([^\]]+)\]/g;

  // Replace markdown links with HTML links
  text = text.replace(markdownLinkPattern, function(match, linkText, url, plainUrl) {
    if (url) {
      return `<a href="${url}" target="_blank">${linkText}</a>`;
    } else if (plainUrl) {
      return `<a href="${plainUrl}" target="_blank">${plainUrl}</a>`;
    }
  });

  // Replace h2. Text with <b>Text</b>
  text = text.replace(/h2\.\s*(.*)/g, function(match, p1) {
    return `<b>${p1}</b>`;
  });

  // Replace h3. Text with <u>Text</u>
  text = text.replace(/h3\.\s*(.*)/g, function(match, p1) {
    return `<u>${p1}</u>`;
  });

  // Replace {code}text{code} with <code>text</code>
  text = text.replace(/{code}(.*?)\{code}/g, function(match, p1) {
    return `<code>${p1}</code>`;
  });

  // Replace {code:something}text{code} with <code>text</code> (ignore the part after `:`)
  text = text.replace(/{code:[^}]+}(.*?)\{code}/g, function(match, p1) {
    return `<code>${p1}</code>`;
  });

  // Replace newlines (\n) with <br> tags for line breaks
  text = text.replace(/(?:\r\n|\r|\n)/g, '<br>');

  return text;
}

function fetchJiraTicket(API_URL) {
  request.open('GET', API_URL, true);

  request.onload = function() {
    if (this.status == 200) {
      const data = JSON.parse(this.response);
      document.getElementById('loading').style.display = 'none';
      document.getElementById('note').style.display = 'block';
      document.getElementById('home').style.display = 'none';
      document.getElementById('ticket').style.display = 'block';

      // All fields that are always there
      document.getElementById('issue-key').innerText = data.key;
      document.getElementById('summary').innerText = data.fields.summary;
      document.getElementById('issuetype').innerText = data.fields.issuetype.name;
      document.getElementById('created').innerText = new Date(data.fields.created).toLocaleString();
      document.getElementById('updated').innerText = new Date(data.fields.updated).toLocaleString();
      document.getElementById('status').innerText = data.fields.status.name
      document.getElementById('reporter').innerText = data.fields.reporter.displayName;

      // Fields that are sometimes there
      if (data.fields.resolution != null) {
        document.getElementById('status').append(' (' + data.fields.resolution.name + ')');
      }
      if (data.fields.assignee != null) {
        document.getElementById('assignee').innerText = data.fields.assignee.displayName;
      } else {
        document.getElementById('assignee').parentNode.style.display = 'none';
      }

      // Get labels
      const labels = data.fields.labels;
      const labelsContainer = document.getElementById('labels');
      if (labels && labels.length > 0) {
        labels.forEach(label => {
          const labelsHTML = `<span class="list-value">${label}</span>`;
          labelsContainer.innerHTML = labelsHTML;
        });
      } else {
        labelsContainer.parentNode.style.display = 'none';
      }

      // Get Sections field
      const sections = data.fields.sections;
      const sectionsContainer = document.getElementById('sections');
      if (sections && sections.length > 0) {
        sections.forEach(section => {
          const sectionsHTML = `<span class="list-value">${section}</span>`;
          sectionsContainer.innerHTML = sectionsHTML;
        });
      } else {
        sectionsContainer.parentNode.style.display = 'none';
      }

      // Get the Sprints
      const sprints = data.fields.customfield_10005;
      const sprintsContainer = document.getElementById('sprints');
      if (sprints && sprints.length > 0) {
        const sprintPattern = /name=([A-Za-z0-9\s#]+)/g;
        const sprintNames = sprints.map(sprintStr => {
          const match = sprintPattern.exec(sprintStr);
          return match ? match[1] : null;
        }).filter(name => name !== null).join(', ');
        sprintsContainer.innerHTML = sprintNames;
      } else {
        sprintsContainer.parentNode.style.display = 'none';
      }

      // Parse description to a rich text format
      if (data.fields.description != null) {
        const convertedText = convertJiraDesc(data.fields.description);
        document.getElementById('description').innerHTML = convertedText;
      }

      // Get comments
      const comment = data.fields.comment;
      const commentsContainer = document.getElementById('comments');
      if (comment && comment.comments && comment.comments.length > 0) {
        comment.comments.forEach(comment => {
          const commentHTML = `
            <div class="comment">
              <div class="author">${comment.author.displayName}</div>
              <div class="date">${new Date(comment.created).toLocaleString()}</div>
              <div class="text">${convertJiraDesc(comment.body)}</div>
            </div>
          `;
          commentsContainer.innerHTML += commentHTML;
        });
      } else {
        commentsContainer.parentNode.style.display = 'none';
      }

      // Get attachments
      const attachment = data.fields.attachment;
      const attachmentsContainer = document.getElementById('attachments');
      if (attachment && attachment.length > 0) {
        attachment.forEach(file => {
          const attachmentHTML = `
            <div class="attachment">
              <a href="${API_URL_PREFIX}attachments/${data.key}/${file.filename}" target="_blank">
                <img src="${API_URL_PREFIX}attachments/${data.key}/thumbs/${file.filename}" alt="${file.filename}">
              </a>
            </div>
          `;
          attachmentsContainer.innerHTML += attachmentHTML;
        });
      } else {
        attachmentsContainer.parentNode.style.display = 'none';
      }

    } else {
      msg.outerHTML = `error :(`;
    }
  };

  request.onerror = function() {
    msg.outerHTML = `error :(`;
  };

  request.send();
}

function renderHome() {
  request.open('GET', HOME_API_URL, true);

  request.onload = function() {
    if (this.status == 200) {
      const data = JSON.parse(this.response);
      document.getElementById('loading').style.display = 'none';
      document.getElementById('note').style.display = 'block';
      document.getElementById('filter').style.display = 'block';

     function renderList(filter = '') {
        const listElement = document.getElementById('item-list');
        listElement.innerHTML = '';

        const reversedEntries = Object.entries(data).reverse();

        reversedEntries.forEach(([key, item]) => {
          if (item.summary.toLowerCase().includes(filter.toLowerCase()) || key.toLowerCase().includes(filter.toLowerCase())) {
            const listItem = document.createElement('li');

            const anchor = document.createElement('a');
            anchor.href = `?key=${key}`;
            anchor.textContent = key;

            listItem.appendChild(anchor);

            listItem.appendChild(document.createTextNode(`: ${item.summary}`));

            listElement.appendChild(listItem);
          }
        });
      }

      document.getElementById('filter').addEventListener('input', function() {
        renderList(this.value);
      });

      renderList();

    } else {
      msg.outerHTML = `error :(`;
    }
  };

  request.onerror = function() {
    msg.outerHTML = `error :(`;
  };

  request.send();
}

const urlParams = new URLSearchParams(window.location.search);
this.urlParam = urlParams.get('key');

const request = new XMLHttpRequest();

if (this.urlParam) {
  API_URL = API_URL_PREFIX + this.urlParam + '.json';
  fetchJiraTicket(API_URL);
} else {
  renderHome();
}