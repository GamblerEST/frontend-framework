export default class Home extends DotComponent {

  cities = [
    { value: "johvi", label: "Jõhvi" },
    { value: "tartu", label: "Tartu" },
    { value: "tallinn", label: "Tallinn" },
    { value: "viljandi", label: "Viljandi" },
    { value: "parnu", label: "Pärnu" },
    { value: "rakvere", label: "Rakvere" },
    { value: "valga", label: "Valga" },
    { value: "keila", label: "Keila" },
    { value: "poltsamaa", label: "Põltsamaa" },
    { value: "haapsalu", label: "Haapsalu" }
  ];

  render() {
    return dot.div({ class: "container-fluid d-flex justify-content-center align-items-center min-vh-100" },
      dot.div({ class: "card bg-transparent border-0" },
        dot.img({ class: "card-img-top", src: "./images/weather.png" }),
        dot.div({ class: "card-body text-center" },
          dot.h1({ class: "card-title" }, "Weather App"),
          dot.h4({ class: "card-text" }, "Made Using Dot.js FrameWork"),
          dot.select({ id: "citySelect", class: "form-select text-center" },
            Dot.each(this.cities, city => dot.option({ value: city.value }, city.label))
          ),
          dot.div({class: "btn-group me-2 btn-group-lg"},
            dot.button({ type: "button", class: "btn mt-2 mb-0 btn-info text-center",
            onClick: () => {
              Dot.navigate('/history');
            }
          }, dot.p({ class: "mb-0" }, "Check History")),
          dot.button({ type: "button", class: "btn mt-2 btn-primary text-center",
            onClick: () => {
              const citySelectEl = document.getElementById("citySelect");
              const city = citySelectEl.value;
              Dot.navigate(`/weather?city=${encodeURIComponent(city)}`);
            }
          }, dot.p({ class: "mb-0" }, "Check Realtime Weather"))
          )
        )
      )
    );
  }
}