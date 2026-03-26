export default class Weather extends DotComponent {

  constructor() {
    super();
    this.watch('history');
  }

  async onMount() {
    const { city } = Dot.router.query;
    if (!city) {
      console.warn("No city in URL");
      this.setState({ error: "No city provided" });
      return;
    }
    try {
      const res = await Dot.http.get(`/api/weather?city=${encodeURIComponent(city)}`);
      const data = typeof res.data === "string" ? JSON.parse(res.data): res.data;
      this.setState({ weather: data });
      this.updateGlobal();
    } catch (err) {
      this.setState({ error: "Failed to load weather" });
    }
  }

  updateGlobal() {
    Dot.store.set("history", [...(Dot.store.get("history") || []), this.localState.weather.ilm]);
  }

  render() {
    if (!this.localState.weather && !this.localState.error) {
      return dot.div({ class: "container-fluid d-flex justify-content-center align-items-center min-vh-100" },
        Dot.h1({}, "Loading Weather Data...")
      )
    }
    if (this.localState.error) {
      return Dot.div({ class: "error" }, this.localState.error);
    }
    const w = this.localState.weather;
    if (!w) {
      return dot.div({ class: "container-fluid d-flex justify-content-center align-items-center min-vh-100" },
        Dot.h1({}, "Loading Weather Data...")
      )
    }
    const ilm = w.ilm;
    const container = dot.div({ class: "container-fluid d-flex justify-content-center align-items-center min-vh-100" },
      dot.div({ class: "modal show", id: "myModal", tabindex: "-1", style: "display:block;" },
        dot.div({ class: "modal-dialog" },
        dot.div({ class: "modal-content" },
        dot.div({ class: "modal-header" },
          dot.h5({ class: "modal-title" }, "Weather Info"),
        ),
        dot.div({ class: "modal-body" },
          Dot.h1({}, `City: ${ilm.linn}`),
          Dot.p({}, `Wind Speed: ${ilm.tuul}`),
          Dot.p({}, `Temperature: ${ilm.temp.replace("&deg;C", "")}`),
          Dot.p({}, `Perceived temperature: ${ilm.windchill.replace("&deg;C", "")}`),
          Dot.p({}, `Wind direction: ${ilm.v_suund.replace("&deg;", "")}`),
          Dot.p({}, `Air humidity: ${ilm.niiskus}`),
          Dot.p({}, `Precipitation: ${ilm.vihm}`),
          Dot.p({}, `UV index: ${ilm.uv}`),
          Dot.p({}, `Air pressure: ${ilm.rohk}`)
        ),

        dot.div({ class: "modal-footer" },
          dot.button({
              class: "btn btn-secondary",
              onClick: () => {
                Dot.navigate("/");
              }
            },
            "Go Back"
          )
        )
      )
    )
  )
  );
  return container;
  }
}