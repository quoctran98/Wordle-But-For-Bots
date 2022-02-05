function get_query_variable (variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (let i = 0; i < vars.length; i++) {
            var pair = vars[i].split("=");
            if (pair[0] == variable) {
                return(pair[1]);
            }
    }
    return(false);
}

function array_mean (arr) {
    let total = arr.reduce((previousValue, currentValue) => (previousValue + currentValue));
    return(total/arr.length);
}

function count_occurences (arr, val) {
    return(arr.reduce((a, v) => (v === val ? a + 1 : a), 0));
}

fetch("../data/player?player_name=" + get_query_variable("player_name")).then(function(response) {
    response.json().then(function(res) {

        document.getElementById("leadboard_button").removeAttribute("hidden"); // i want everything to show at the same time

        if (res.hasOwnProperty("error")) {
            document.getElementById("player_name_header").innerHTML = "";
            document.getElementById("player_mean_score").innerHTML = "no data available";
            return;
        }

        if (res.scores.length == 0) {
            document.getElementById("player_name_header").innerHTML = res.player_name + "'s Stats";
            document.getElementById("player_mean_score").innerHTML = "no data available";
            return;
        }

        document.getElementById("player_name_header").innerHTML = res.player_name + "'s Stats";
        document.getElementById("player_mean_score").innerHTML = Math.round(array_mean(res.scores)*1000)/1000 + " average guesses";
        
        let x_axis = [1, 2, 3, 4, 5, 6, 7, 8];
        let y_axis = [];
        x_axis.forEach((x) => {
            y_axis.push(count_occurences(res.scores, x))
        });

        const ctx = document.getElementById('histogram').getContext('2d');
        const chart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: x_axis,
                datasets: [{
                label: "",
                data: y_axis,
                backgroundColor: "#0275d8",
                }]
            },
            options: {
                maintainAspectRatio: false,
                responsive: true,
                scales: {
                xAxes: [{
                    display: false,
                    barPercentage: 1.3,
                    ticks: {
                    max: 8,
                }}, {
                    display: true,
                    ticks: {
                      autoSkip: false,
                      max: 8,
                    }
                }]},
                legend: {
                    display: false
                },
                plugins: {
                    legend: {
                      display: false
                    }
                }
            }
        });
    });
});