const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

// stolen from https://www.valentinog.com/blog/html-table/
function generateTableHead(table, data) {
    let thead = table.createTHead();
    let row = thead.insertRow();
    for (let key of data) {
      let th = document.createElement("th");
      let text = document.createTextNode(key);
      th.appendChild(text);
      row.appendChild(th);
    }
}
  
function generateTable(table, data) {
    for (let element of data) {
      let row = table.insertRow();
      for (key in element) {
        let cell = row.insertCell();
        let text = document.createTextNode(element[key]);
        cell.appendChild(text);
      }
    }
}

fetch('../data/leaderboard').then(function(response) {
  response.json().then(function(res) {
    let new_res = [];
    res.forEach(function(row) { // edit and process the Scores object
      let new_row = row;

      const time_registered_date = new Date(row.time_registered);
      new_row.time_registered = (months[time_registered_date.getMonth()] + " " + time_registered_date.getDate())

      new_row.mean_score = Math.round(new_row.mean_score * 1000)/1000

      new_res.push(new_row);
    });
    let table = document.querySelector("table");
    let row_headers = Object.keys(new_res[0]);
    row_headers = ["Player", "Avg. Guesses", "Games Played", "Date Joined"]
    generateTable(table, new_res);
    generateTableHead(table, row_headers);
  });
});