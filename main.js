const svg = d3.select('#chart')

const width = parseInt(svg.style('width'));
const height = parseInt(svg.style('height'));

const margin = {top: 10, right: 10, bottom: 40, left: 50}

const g = svg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`)

const xScale = d3.scaleLinear().range([0, width - margin.left - margin.right])
const yScale = d3.scaleLinear().range([height - margin.top - margin.bottom, margin.top])
const rScale = d3.scaleSqrt().range([5, 15])
const opacityScale = d3.scaleLinear().range([0.4, 0.9])

function createPolygonalPath(n, up=true) {
    let index = [...Array(n).fill(0).map((_, i) => i)]
    let points = index.map(i => { 
        return {
            x: Math.cos(i*2*Math.PI/n + 0.5*(up ? -1 : 1) * Math.PI), 
            y: Math.sin(i*2*Math.PI/n + 0.5*(up ? -1 : 1) * Math.PI)
        }; 
    })

    return points.map((p, i) => `${i == 0 ? 'M' : 'L'}${p.x},${p.y} ${i === n-1 ? 'Z' : ''}`).join('')
}

function createStarPath(n, radiiRatio = 0.5, up = true) {
    let index = [...Array(2*n).fill(0).map((_, i) => i)]
    let points = index.map(i => { 
        return {
            x: (i % 2 == 0 ? 1 : radiiRatio) * Math.cos(i*Math.PI/n + 0.5*(up ? -1 : 1) * Math.PI), 
            y: (i % 2 == 0 ? 1 : radiiRatio) * Math.sin(i*Math.PI/n + 0.5*(up ? -1 : 1) * Math.PI)
        }; 
    })

    return points.map((p, i) => `${i == 0 ? 'M' : 'L'}${p.x},${p.y} ${i === 2*n-1 ? 'Z' : ''}`).join('')
}

function displayInfo(d) {
    console.log(d)
    const info = d3.select('#info')

    info.html('')
        
    if (d.isDeprecated) {
        info.append('h1').append('i').text(`${d.codes.join(', ')}`)
        info.append('h2').append('i').text(`${d.name} (deprecated)`)
    } else {
        info.append('h1').text(`${d.codes.join(', ')}`)
        info.append('h2').text(`${d.name} ${d.tags.length > 0 ? '(' + d.tags.join(', ') + ')': ''}`)
    }

    info.append('p').text(d.description)

    info.append('p').text(`credit hours: ${d.creditHours}`)
    info.append('p').text(`rating: ${d.rating.toLocaleString( undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    info.append('p').text(`difficulty: ${d.difficulty.toLocaleString( undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)
    info.append('p').text(`workload: ${d.workload.toLocaleString( undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`)

    if (d.textbooks.length > 0) {
        const textbooks = info.append('div')
        textbooks.append('p').text('textbooks:')
        textbooks.append('ul').selectAll('li').data(d.textbooks).enter().append('li').append('a')
            .attr('href', d => d.url)
            .attr('target', '_blank')
            .text(d => d.name)
    }



}

const shapes = ['circle', 'triangleUp', 'diamond', 'pentagon', 'star5', 'hexagon', 'star6', 'octagon', 'triangleDown']

const shapePaths = {
    circle: createPolygonalPath(64),
    triangleUp: createPolygonalPath(3),
    triangleDown: createPolygonalPath(3, false),
    diamond: createPolygonalPath(4),
    pentagon: createPolygonalPath(5),
    hexagon: createPolygonalPath(6),
    octagon: createPolygonalPath(8),
    star4: createStarPath(4),
    star5: createStarPath(5),
    star6: createStarPath(6),
}

// const url = 'https://www.omscentral.com/_next/data/RbJpKU_7gp7Gm26pP9748/index.json'
const url = './index.json'

d3.json(url).then(data => {
    const courseData = d3.sort(data.pageProps.courses.filter(d => d.rating), x => x.reviewCount)
    courseData.forEach(course => {
        const re = /(\w*)-/
        const code = re.exec((course.codes[0]))[1]
        course.code = code
    })

    console.log(courseData)
    
    xScale.domain([0.75, 5])
    yScale.domain([1.75, 5])
    rScale.domain(d3.extent(courseData, x => x.workload))
    opacityScale.domain(d3.extent(courseData, x => x.reviewCount))
    const codes = new Set(courseData.map(x => /(\w*)-/.exec((x.codes[0]))[1]))
    const codeShape = {}
    
    const hues = {}
    Array.from(codes).forEach((code, i, s) => {
        hues[code] = 360 * i / s.length
        codeShape[code] = shapes[i]
    })
    console.log(codeShape)

    const xAxis = d3.axisBottom(xScale)
    const yAxis = d3.axisLeft(yScale)

    const xMedian = d3.median(courseData, x => x.rating)
    const yMedian = d3.median(courseData, x => x.difficulty)

    g.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0, ${height - margin.top - margin.bottom})`)
        .call(xAxis)
        .append('text')
        .text('Difficulty')
        .attr('transform', `translate(${width/2}, ${margin.bottom - 5})`)

    g.append('g')
        .attr('class', 'axis')
        //.attr('transform', `translate(0, 30)`)
        .call(yAxis)

    g.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', d3.max(xScale.range()))
        .attr('height', yScale(yMedian))
        .attr('fill', 'hsla(240, 0%, 15%, 0.5)')

    g.append('rect')
        .attr('x', xScale(xMedian))
        .attr('y', 0)
        .attr('width', d3.max(xScale.range()) - xScale(xMedian))
        .attr('height', d3.max(yScale.range()))
        .attr('fill', 'hsla(240, 0%, 15%, 0.5)')

    const bubbles = g.selectAll('.course').data(courseData).enter().append('path')
        .attr('class', 'course')
        .attr('d', d => shapePaths[codeShape[d.code]])
        .attr('transform', d => `translate(${xScale(+d.difficulty)}, ${yScale(+d.rating)}) scale(${rScale(+d.workload)})`)
        .attr('stroke', d => d.isFoundational ? `hsl(${hues[d.code]}, 100%, 85%)` : 'none')
        .attr('stroke-width', d => 1/rScale(+d.workload))
        .attr('fill', d => {
            let hue = hues[d.code]
            return `hsla(${hue}, 100%, 50%, ${opacityScale(d.reviewCount)})`
        })
        .on('mouseenter', function() { displayInfo(d3.select(this).datum()) })

    
})
