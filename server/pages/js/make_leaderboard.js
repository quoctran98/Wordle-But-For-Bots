const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

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
        let text;

        if (key == "player_name") {
          let url_string = "/player_info.html?player_name=" + element[key]
          text = Object.assign(document.createElement("a"),{href: url_string, innerText: element[key]});
        } else {
          text = document.createTextNode(element[key]);
        }
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
      new_row.time_registered = (months[time_registered_date.getMonth()] + " " + time_registered_date.getDate());
      new_row.time_registered += " at " + ((time_registered_date.getHours() + 1) % 12) + ":"
      new_row.time_registered += String(time_registered_date.getMinutes()).padStart(2, "0") + ((time_registered_date.getHours()) >= 12 ? " PM" : " AM")

      new_row.mean_score = Math.round(new_row.mean_score * 100)/100

      new_res.push(new_row);
    });
    let table = document.getElementById("leadberoard_html_table");
    let row_headers = Object.keys(new_res[0]);
    row_headers = ["Player", "Avg. Guesses", "Games Played", "Date Joined"]
    generateTable(table, new_res);
    generateTableHead(table, row_headers);

    $('#leadberoard_html_table').DataTable();
  });
});