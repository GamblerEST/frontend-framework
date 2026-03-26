export default class History extends DotComponent {
  constructor() {
    super();
    this.watch('history');
    const history = Dot.store.get('history') || [];
    
    this.scroller = new VirtualScroller({
      items: history.reverse(),
      itemHeight: 382,
      containerHeight: 500
    });
  }

  handleScroll(e) {
    this.scroller.calculateVisible(e.target.scrollTop);
    this.update();
  }

  render() {
    const history = Dot.store.get('history') || [];
    if (!history.length) {
      return Dot.div({ class: "container-fluid d-flex justify-content-center align-items-center min-vh-100" },
        Dot.h2({}, "Weather History"),
        Dot.p({}, "No history yet."),
        Dot.button({ class: "btn btn-secondary mt-3", onClick: () => Dot.navigate("/") }, "Back")
      );
    }
    const { visibleStart, visibleEnd, offset, totalHeight } = this.scroller.calculateVisible(this.scroller.scrollTop);
    const visibleItems = this.scroller.items.slice(visibleStart, visibleEnd);
    return Dot.div({ class: "container-fluid d-flex justify-content-center align-items-center min-vh-100" },
      dot.div({ class: "modal show", id: "historyModal", tabindex: "-1", style: "display:block;" },
        dot.div({ class: "modal-dialog" },
          dot.div({ class: "modal-content" },
            dot.div({ class: "modal-header" },
              dot.h5({ class: "modal-title" }, "Weather History")
            ),
            dot.div({ 
              class: "modal-body", 
              style: { height: '500px', overflowY: 'auto' },
              onScroll: (e) => this.handleScroll(e)
            },
              dot.div({ style: { height: `${totalHeight}px`, position: 'relative' } },
                dot.div({ style: { transform: `translateY(${offset}px)` } },
                  ...visibleItems.map((ilm, idx) => 
                    dot.div({ 
                      key: idx, 
                      class: "card mb-3", 
                      style: { padding: '16px' } 
                    },
                      Dot.h5({ class: "card-title" }, ilm.linn),
                      Dot.p({}, `Wind Speed: ${ilm.tuul}`),
                      Dot.p({}, `Temperature: ${ilm.temp.replace("&deg;C", "")}`),
                      Dot.p({}, `Perceived temperature: ${ilm.windchill.replace("&deg;C", "")}`),
                      Dot.p({}, `Wind direction: ${ilm.v_suund.replace("&deg;", "")}`),
                      Dot.p({}, `Air humidity: ${ilm.niiskus}`),
                      Dot.p({}, `Precipitation: ${ilm.vihm}`),
                      Dot.p({}, `UV index: ${ilm.uv}`),
                      Dot.p({}, `Air pressure: ${ilm.rohk}`)
                    )
                  )
                )
              )
            ),
            dot.div({ class: "modal-footer" },
              dot.button({ class: "btn btn-secondary", onClick: () => Dot.navigate("/") }, "Back")
            )
          )
        )
      )
    );
  }
}