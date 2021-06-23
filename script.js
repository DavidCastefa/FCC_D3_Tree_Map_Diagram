// Some of the JavaScript used in this project is based on Ganesh H's YouTube walkthrough
// at https://www.youtube.com/watch?v=wvfBn7GCCHk


let movieDataUrl = "https://cdn.freecodecamp.org/testable-projects-fcc/data/tree_map/movie-data.json"
let movieData

let height = window.innerHeight * 0.71;
let width = window.innerWidth * 0.92;

let padding = 50

let canvas = d3.select("#canvas")
canvas.attr("height", height)
      .attr("width", width)

let drawTreeMap = () => {
  // Since the data already as the parent-children structure D3 requires,
  // we can directly sort the data tree by branch (genre / category) and leaves (movie)
  let hierarchy = d3.hierarchy(movieData)
                    .sum(dataItem => dataItem.value)
                    .sort((node1, node2) => node2.value - node1.value)

  // Next, we create the tree map directly using D3                  
  let createTreeMap = d3.treemap()
                        .size([width, height])
  createTreeMap(hierarchy)

  // We create a new object containing only the movies, sorted by the above
  let movieTiles = hierarchy.leaves()
  console.log(movieTiles)

  // We prepare the tooltip 
  let tooltip = d3.select("body")
                  .append("div")
                  .attr("id", "tooltip")
                  .style("opacity", 0)

  // Now we can draw the tree map
  canvas.selectAll("g")
        .data(movieTiles)
        .enter().append("g")
        .attr("transform", movie => "translate(" + movie.x0 + ", " + movie.y0 + ")" )
        .append("rect")
        .attr("class", "tile")
        .attr("fill", movie => {
          let genre = movie.data.category
          if (genre == "Action") return "#bc7d52" // greyish orange 
          if (genre == "Drama") return "#33ae81" // greyish green 
          if (genre == "Adventure") return "slateblue"
          if (genre == "Family") return "pink"
          if (genre == "Animation") return "#f3c911" // greyish yellos
          if (genre == "Comedy") return "#e04138" // greyish red
          if (genre == "Biography") return "royalblue"
         })
        .attr("data-name", movie => movie.data.name)
        .attr("data-category", movie => movie.data.category)
        .attr("data-value", movie => movie.data.value)
        .attr("width", movie => movie.x1 - movie.x0)
        .attr("height", movie => movie.y1 - movie.y0)
        .on("mouseover", (event, movie) => {
          let genre = movie.data.category
          let sales = movie.data.value
          let movieName = movie.data.name
          tooltip.style("opacity", 1)
                 .attr("data-value", sales)
                 .html(
                    movieName + "<br>" + 
                    "Type: " + genre + "<br>" + 
                    "Sales: US$" + `${sales.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`
                  )
                 .style("position", "absolute")
                 .style("left", (event.pageX + 15) + "px")
                 .style("top", (event.pageY - 40) + "px")
          })
        .on("mouseleave", (event, item) => {
          tooltip.style("opacity", 0)
                 .html("")  // Avoid interference with other data points
          })

  // Place movie titles on tiles and wrap text.
  let fontSize = 11

  // Based on https://medium.com/swlh/create-a-treemap-with-wrapping-text-using-d3-and-react-5ba0216c48ce
  function wrapText(selection)  {
    selection.each( function () {            // I may not need this, since I'm working with only one text at a time...
      const node = d3.select(this);
      // Coerces to a number.  Subtract 1 to maintain right margin.
      const rectWidth = +node.attr("width") -1;  // Coerces to a number.  I don't think I need this either
      let word;
      // Break off into an array of single words in reverse order.
      // This will allow us to pop words off later and reconstruct our text.
      const words = node.text().split(" ").reverse(); 
      let line = [];
      const x = node.attr("x");
      const y = node.attr("y");
      // Create a tspan and initialize it with no text
      let tspan = node.text("").append("tspan").attr("x", x).attr("y", y);
      // Keep track of lineNumber so as not to overwrite tspans
      let lineNumber = 0;
      while (words.length > 1) {  // Loop through until we're on last word
        // Pop off last word, which is our first since we reversed the array
        word = words.pop();
        line.push(word);  // Add popped word to the end of our initially empty array
        tspan.text(line.join(" ")); // Join text to our new tspan
        const tspanLength = tspan.node().getComputedTextLength();  // Get the tspan width
        // Check to see if we need to stop the loop:
        // 1. See if tspan length is now greater than tile width.
        // 2. Also check to see if our line array has a length of 1.
        //    If so, it's the first word in the current line, and we don't want a new line.
        if (tspanLength > rectWidth && line.length !== 1) {
          // If we've already added a word that doesn't fit, pop it back off
          line.pop();
          // Next, join the newly shortened ‘line’ array into a string
          // and set the text of the current tspan to that string
          tspan.text(line.join(' '));
          // Next we redefine ‘line’ as an array of ‘word’,
          // which was the word that previously made the text in our tspan overflow our tile.
          line = [word];
          // Finally, redefine tspan as a new tspan on a new line with its text as the word
          // that made the previous tspan’s text overflow our tile.
          tspan = addTspan(word);        
        }
      }
      addTspan(words.pop());  // Add the last word where necessary

      function addTspan(text) {
        lineNumber += 1;
        return (
          node
            .append('tspan')
            .attr('x', x)
            .attr('y', y)
            .attr('dy', `${lineNumber * fontSize}px`)
            .text(text)
        );
      }
    }) 
  }

  canvas.selectAll("g")
        .data(movieTiles)
        .append("text")
        .text(movie => movie.data.name)
        .attr("width", movie => movie.x1 - movie.x0)
        .attr('font-size', `${fontSize}px`)
        .attr("x", 2)
        .attr("y", fontSize)
        .attr("id", "movie-title")
        .call(wrapText)        

}

d3.json(movieDataUrl).then(
  (data, error) => {
    if (error) console.log(error)
    else {
      movieData = data
      console.log(movieData)

      drawTreeMap()
    }
  }
)