;(function(undefined) {

  /**
   * Article "Node Renderer" main script
   * ====================================
   *
   * Building a random graph with fancy custom renderers.
   *
   * Author: Guillaume Plique (Yomguithereal)
   */

  // Generating random graph
  function generateRandomGraph() {
    var i,
        s,
        o,
        N = 100,
        E = 500,
        C = 5,
        d = 0.5,
        cs = [],
        g = {
          nodes: [],
          edges: []
        };

    var palette = [
      '#94B8B5',
      '#C46446',
      '#A761B1',
      '#95BF55',
      '#544440'
    ];

    // Generate the graph:
    for (i = 0; i < C; i++)
      cs.push({
        id: i,
        nodes: [],
        color: palette[i]
      });

    for (i = 0; i < N; i++) {
      o = cs[(Math.random() * C) | 0];
      g.nodes.push({
        id: 'n' + i,
        label: faker.name.findName(),
        x: 100 * Math.cos(2 * i * Math.PI / N),
        y: 100 * Math.sin(2 * i * Math.PI / N),
        size: Math.random(),
        color: o.color
      });
      o.nodes.push('n' + i);
    }

    for (i = 0; i < E; i++) {
      if (Math.random() < 1 - d)
        g.edges.push({
          id: 'e' + i,
          color: '#ccc',
          source: 'n' + ((Math.random() * N) | 0),
          target: 'n' + ((Math.random() * N) | 0)
        });
      else {
        o = cs[(Math.random() * C) | 0]
        g.edges.push({
          id: 'e' + i,
          color: '#ccc',
          source: o.nodes[(Math.random() * o.nodes.length) | 0],
          target: o.nodes[(Math.random() * o.nodes.length) | 0]
        });
      }
    }

    return g;
  }

  // Instantiating sigma
  var intro = new sigma({
    graph: generateRandomGraph(),
    settings: {
      labelThreshold: 10,
      minNodeSize: 1,
      maxNodeSize: 7,
      defaultNodeType: 'border'
    }
  });

  var outro = new sigma({
    graph: generateRandomGraph(),
    settings: {
      labelThreshold: 10,
      minNodeSize: 1,
      maxNodeSize: 7,
      defaultNodeType: 'border',
      defaultEdgeType: 'silly'
    }
  });

  // Adding renderers
  intro.addRenderer({
    container: document.querySelector('#intro-graph'),
    type: 'canvas'
  });

  outro.addRenderer({
    container: document.querySelector('#outro-graph'),
    type: 'canvas'
  });

  // Dropping orphans
  intro.graph.dropOrphans();
  outro.graph.dropOrphans();

  // Refreshing
  intro.refresh();
  outro.refresh();

  intro.startForceAtlas2({slowDown: 3});
  outro.startForceAtlas2({slowDown: 3});

  // Stopping layout after some time
  setTimeout(function() {
    intro.stopForceAtlas2();
    outro.stopForceAtlas2();
  }, 7000);

  // Example
  var example = new sigma({
    graph: {
      nodes: [
        {
          id: 'm',
          label: 'Murat',
          x: 75,
          y: 0,
          size: 5,
          color: '#94B8B5',
          borderColor: '#fff',
        },
        {
          id: 'n',
          label: 'Ney',
          x: 75,
          y: 75,
          size: 8,
          color: '#C46446',
          borderColor: '#000',
          borderWidth: 3
        },
        {
          id: 'd',
          label: 'Davout',
          x: 0,
          y: 75,
          size: 8,
          color: '#A761B1',
          borderColor: '#000',
        }
      ],
      edges: [
        {id: 'e01', source: 'm', target: 'n'},
        {id: 'e02', source: 'm', target: 'd'},
        {id: 'e03', source: 'n', target: 'd'},
      ]
    },
    renderer: {
      type: 'canvas',
      container: 'example-graph'
    },
    settings: {
      autoRescale: false,
      defaultNodeType: 'border'
    }
  });
}).call(this);
