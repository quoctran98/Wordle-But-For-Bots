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

fetch('./leaderboard_data').then(function(response) {
  response.json().then(function(res) {
    let res_with_date = [];
    res.forEach(function(row) { // edit and process the Scores object
      let new_row = row;
      const time_registered_date = new Date(row.time_registered);
      console.log(time_registered_date);
      new_row.time_registered = (months[time_registered_date.getMonth()] + " " + time_registered_date.getDate())
      res_with_date.push(new_row);
    });
    let table = document.querySelector("table");
    let row_headers = Object.keys(res_with_date[0]);
    row_headers = ["Player", "Avg. Guesses", "Games Played", "Date Joined"]
    generateTable(table, res_with_date);
    generateTableHead(table, row_headers);
  });
});