async function fetchAndPlot() {
  const ticker = document.getElementById('ticker-input').value.trim().toUpperCase();
  const axis = document.getElementById('toggle-axis').getAttribute('data-axis');
  const callCount = document.getElementById('call-count').value.trim();
  const baseUrl = window.location.hostname === "localhost"? "http://127.0.0.1:8000": "https://api.volatilitysurfaces.com";
    try {
      console.log("ticker:", ticker);
      
      const res = await fetch(`${baseUrl}/api/surface?ticker=${ticker}&xAxis=${axis}&max_expiries=${callCount}`);
      const data = await res.json();

      if (!data.x || !data.y || !data.z) {
        throw new Error('Invalid data format');
        return;
      }
      function transpose(matrix) {
      return matrix[0].map((_, colIndex) => matrix.map(row => row[colIndex]));
      }
      const spot = data.spot;
      const xAxis = data.xaxis;
      const ylabels = data.y_labels;
      const x = data.x    // Expiry in years
      const y = data.y    // Strike prices
      const z = data.z // IV matrix [strike][expiry]
      //z[i][j] = IV at expiry[i], strike[j]
      //this is reverse of what ploty expects which is 
      //z[y][x] = IV at strike[y], expiry[x]
      console.log("x:", data.x.length);
      console.log("y:", data.y.length);
      console.log("z:", data.z.length, "x each row:", data.z.map(row => row.length));
      console.log("z:", data.z);

      document.getElementById('spot-display').innerHTML = `${spot}`;

      const customdata = [];

      for (let i = 0; i < x.length; i++) {
        const row = [];
        for (let j = 0; j < ylabels.length; j++) {
          row.push(ylabels[j]);
        }
        customdata.push(row);
      }
      

      const plotData = [{
        type: 'surface',
        connectgaps: false,
        x: x,
        y: y,
        z: z, // Transpose to match Plotly's expected format
        colorscale: 'Jet',
        showscale: true,
        customdata: customdata,
        hovertemplate:
          'Time to Expiration: %{x:.2f} years<br>' +
          (xAxis === 'moneyness' 
            ? 'Strike Price: $%{customdata:.2f}<br>'
            : 'Strike Price: $%{y:.2f}<br>') +
          'Implied Volatility: %{z:.2f}%<extra></extra>',
      }];

      const layout = {
        title: {
          //text: 'Implied Volatility Surface',
          font: { size: 24 },
          x: 0.5,
          xanchor: 'center'
        },
        margin: { l: 0, r: 0, b: 0, t: 20 },
        scene: {
          xaxis: {
            title: {
              text: 'Time to Expiration (years)',
              font: { size: 16 }
            },
            range: [Math.min(...x), Math.max(...x)],
            autorange: false
          },
          yaxis: {
            title: {
              text: axis === 'moneyness' ? 'Moneyness' : 'Strike Price ($)',
              font: { size: 16 }
            }
          },
          zaxis: {
            title: {
              text: 'Implied Volatility (%)',
              font: { size: 16 }
            }
          }
        }
      };

      Plotly.newPlot('surface-plot', plotData, layout, { responsive: true });
    } catch (err) {
      console.error('Failed to fetch or plot data:', err);
    }
  }

  document.getElementById('refresh-button').addEventListener("click", fetchAndPlot);

  document.getElementById('toggle-axis').addEventListener("click", function() {
    const currentAxis = document.getElementById('toggle-axis').getAttribute('data-axis');
    if (currentAxis === 'moneyness') {
      document.getElementById('toggle-axis').setAttribute('data-axis', 'strike');
      document.getElementById('toggle-axis').innerText = 'Strike';
    }
    else if (currentAxis === 'strike') {
      document.getElementById('toggle-axis').setAttribute('data-axis', 'moneyness');
      document.getElementById('toggle-axis').innerText = 'Moneyness';
    }
    fetchAndPlot();
  });
  document.getElementById('ticker-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      fetchAndPlot();
    }
  });


  fetchAndPlot();

