(() => {
  "use strict";

  // Fetch all the forms we want to apply custom Bootstrap validation styles to
  const forms = document.querySelectorAll(".needs-validation");

  // Loop over them and prevent submission
  Array.from(forms).forEach((form) => {
    form.addEventListener(
      "submit",
      (event) => {
        if (!form.checkValidity()) {
          event.preventDefault();
          event.stopPropagation();
        }

        form.classList.add("was-validated");
      },
      false
    );
  });
})();

const tooltipTriggerList = document.querySelectorAll(
  '[data-bs-toggle="tooltip"]'
);
const tooltipList = [...tooltipTriggerList].map(
  (tooltipTriggerEl) => new bootstrap.Tooltip(tooltipTriggerEl)
);

async function get_events() {
  let res = await fetch(
    `/api/get_events?season=${$("#year_selection").val()}&team_number=${$(
      "#team_number"
    ).val()} `
  );
  resp = await res.json();

  $("#event_selection").empty();

  resp.forEach((element) => {
    var opt = document.createElement("option");
    opt.value = element[1];
    opt.innerHTML = element[0];
    $("#event_selection").append(opt);
  });
}

function reload_team_list() {
  eventCode = $("#event_selection").val();
  window.location.assign("/team_list?event=" + eventCode);
}

function toggleFullScreen() {
  const chartContainer = document.getElementById("ranking_score").parentNode;
  if (!document.fullscreenElement) {
    chartContainer.requestFullscreen().catch((err) => {
      alert(
        `Error attempting to enable full-screen mode: ${err.message} (${err.name})`
      );
    });
  } else {
    document.exitFullscreen();
  }
}

async function get_rankings() {
  $("#calculate_spinner").removeClass("d-none");
  $("#calculate_label").addClass("d-none");

  var use_OPR = document.getElementById("use_OPR").checked;
  var use_CCWMS = document.getElementById("use_CCWMS").checked;
  var use_overall_EPA = document.getElementById("use_overall_EPA").checked;
  var use_auto_EPA = document.getElementById("use_auto_EPA").checked;
  var use_teleop_EPA = document.getElementById("use_TeleOp_EPA").checked;
  var use_endgame_EPA = document.getElementById("use_endgame_EPA").checked;
  let res = await fetch(
    `/api/get_rankings?event=${$(
      "#event_selection"
    ).val()}&OPR=${use_OPR}&CCWMS=${use_CCWMS}&Overall=${use_overall_EPA}&Auto=${use_auto_EPA}&Teleop=${use_teleop_EPA}&Endgame=${use_endgame_EPA}`
  );
  let resp = await res.json();

  $("#calculate_spinner").addClass("d-none");
  $("#calculate_label").removeClass("d-none");

  names = resp[0];
  // console.log(names);
  scores = resp[1];

  if (document.getElementById("ranking_score").style["display"] == "") {
    const ctx = document.getElementById("ranking_score").getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: names,
        datasets: [
          {
            // axis: 'y',
            label: "Unitless Rankings",
            data: scores,
            borderWidth: 1,
            backgroundColor: "#ADD4B1",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          // indexAxis: 'y',
          x: {
            beginAtZero: true,
            stacked: true,
          },
          y: {
            stacked: true,
          },
        },
      },
    });
    $("#ranking_score").removeClass("d-none");
  } else {
    chart = Chart.getChart("ranking_score");
    removeData(chart);
    addData(chart, names, scores);
  }
}

async function get_epas() {
  $("#calculate_epa_spinner").removeClass("d-none");
  $("#calculate_epa_label").addClass("d-none");
  let res = await fetch(`api/get_epas?event=${$("#event_selection").val()}`);
  let resp = await res.json();
  $("#calculate_epa_spinner").addClass("d-none");
  $("#calculate_epa_label").removeClass("d-none");

  names = resp[0];
  // console.log(names);
  scores = resp[1];
  // console.log(scores);
  scores = scores[0].map((_, colIndex) => scores.map((row) => row[colIndex]));
  if (document.getElementById("ranking_score").style["display"] == "") {
    const ctx = document.getElementById("ranking_score").getContext("2d");
    new Chart(ctx, {
      type: "bar",
      data: {
        labels: names,
        datasets: [
          {
            label: "Penalties",
            data: scores[3],
            borderWidth: 1,
            backgroundColor: "#B7E2EB",
          },
          {
            label: "Endgame EPA",
            data: scores[2],
            borderWidth: 1,
            backgroundColor: "#8DDDCA",
          },
          {
            label: "Teleop EPA",
            data: scores[1],
            borderWidth: 1,
            backgroundColor: "#C6EBB7",
          },
          {
            label: "Auto EPA",
            data: scores[0],
            borderWidth: 1,
            backgroundColor: "#DFFFC0",
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          // indexAxis: 'y',
          x: {
            beginAtZero: true,
            stacked: true,
          },
          y: {
            stacked: true,
          },
        },
      },
    });
    $("#ranking_score").removeClass("d-none");
  } else {
    chart = Chart.getChart("ranking_score");
    removeData(chart);
    addEPA(chart, names, scores);
  }
}

function load_graphs(json) {
  json = JSON.parse(json);
  for (let i = 0; i < json.length; i++) {
    let ctx = document.getElementById(i).getContext("2d");
    let data = {
      labels: json[i]["labels"],
      datasets: [
        {
          label: json[i]["title"],
          data: json[i]["data"],
          borderWidth: 1,
          backgroundColor: json[i]["colors"],
        },
      ],
    };
    data["datasets"][0] = Object.assign(
      {},
      data["datasets"][0],
      json[i]["dataset_options"]
    );

    new Chart(ctx, {
      type: json[i]["type"],
      data: data,
      options: json[i]["options"],
    });
  }
}
function addEPA(chart, label, scores) {
  chart.data.labels = label;
  chart.data.datasets.push(
    {
      label: "Penalties",
      data: scores[3],
      borderWidth: 1,
      backgroundColor: "#B7E2EB",
    },
    {
      label: "Endgame EPA",
      data: scores[2],
      borderWidth: 1,
      backgroundColor: "#8DDDCA",
    },
    {
      label: "Teleop EPA",
      data: scores[1],
      borderWidth: 1,
      backgroundColor: "#C6EBB7",
    },
    {
      label: "Auto EPA",
      data: scores[0],
      borderWidth: 1,
      backgroundColor: "#DFFFC0",
    }
  );
  chart.update();
}

function addData(chart, label, newData) {
  chart.data.labels = label;
  chart.data.datasets.push({
    label: "Unitless Rankings",
    data: newData,
    borderWidth: 1,
    backgroundColor: "#ADD4B1",
  });
  chart.update();
}

function removeData(chart) {
  chart.data.labels = [];
  chart.data.datasets = [];
}

function search_team() {
  team = $("#team_search").val();
  window.location.assign("/team/" + team);
}

function change_flex() {
  $("#content").attr(
    "style",
    "display: flex; justify-content: center; align-items: center;"
  );
}

function add_chat(chat, isBot) {
  var div = document.createElement("div");
  div.classList.add("d-flex", "flex-row", "p-3");
  if (isBot) {
    div.classList.add("justify-content-start");
  } else {
    div.classList.add("justify-content-end");
  }

  var div2 = document.createElement("div");
  div2.classList.add("bg-white", "mr-2", "p-3");

  var span = document.createElement("span");
  span.classList.add("text-muted");
  span.innerHTML = chat;

  var img = document.createElement("img");
  if (isBot) {
    img.src = "https://img.icons8.com/?size=512&id=102660&format=png";
  } else {
    img.src =
      "https://img.icons8.com/color/48/000000/circled-user-male-skin-type-7.png";
  }
  img.height = 30;
  img.width = 30;

  div2.append(span);
  if (isBot) {
    div.append(img);
    div.append(div2);
  } else {
    div.append(div2);
    div.append(img);
  }

  $("#chats").append(div);

  var objDiv = document.getElementById("chats");
  objDiv.scrollTop = objDiv.scrollHeight;
}

async function send_chat() {
  chat = $("#chat_input").val();
  add_chat(chat, false);

  let res = await fetch(`/api/chat_response?chat=${chat}`);
  res = await res.text();

  add_chat(res, true);
}

function search_notes() {
  query = document.getElementById("note_search").value;
  let arr = Array.from(document.getElementById("notes_group").childNodes);
  arr.splice(0, 1);
  for (let i = 0; i < arr.length / 2; i++) {
    if (!arr[i * 2].innerHTML.toLowerCase().includes(query.toLowerCase())) {
      arr[i * 2].classList.add("d-none");
    } else {
      arr[i * 2].classList.remove("d-none");
    }
  }
}

function filter_raw_data() {
  query = document.getElementById("upload_search").value;
  let arr = Array.from(
    document.getElementById("uploaded_list_group").childNodes
  );
  arr.splice(0, 1);
  for (let i = 0; i < arr.length / 2; i++) {
    if (!arr[i * 2].innerHTML.includes("_" + query)) {
      arr[i * 2].classList.add("d-none");
    } else {
      arr[i * 2].classList.remove("d-none");
    }
  }
}

function filter_complete_data() {
  query = document.getElementById("processed_search").value;
  let arr = Array.from(
    document.getElementById("processed_list_group").childNodes
  );
  arr.splice(0, 1);
  for (let i = 0; i < arr.length / 2; i++) {
    if (!arr[i * 2].innerHTML.includes("_" + query)) {
      arr[i * 2].classList.add("d-none");
    } else {
      arr[i * 2].classList.remove("d-none");
    }
  }
}

async function load_media(team_number) {
  let res = await fetch(`/api/get_team_media?team_number=${team_number}`);
  let resp = await res.json();
  let len = resp.length;
  // console.log(resp);
  if (len == 0) {
    var img = document.createElement("img");
    img.src = "./static/images/no-image-available.webp";
    if (window.location.pathname == "/team_list") {
      img.classList.add("col-4", "center-cropped-list");
    } else {
      img.classList.add("card-img", "center-cropped", "rounded", "float-end");
    }
    document.getElementById(`${team_number}-placeholder`).replaceWith(img);
  } else if (len == 1) {
    const img = document.createElement("img");
    img.src = resp[0];
    if (window.location.pathname == "/team_list") {
      img.classList.add("col-4", "center-cropped-list");
    } else {
      img.classList.add(
        "card-img-top",
        "center-cropped",
        "rounded",
        "float-end"
      );
    }
    document.getElementById(`${team_number}-placeholder`).replaceWith(img);
  } else {
    const carousel = document.createElement("div");
    carousel.id = `carousel${team_number}`;
    carousel.classList.add("carousel", "slide", "col-4");
    // carousel.dataset.bsRide = "carousel";
    const carouselInner = document.createElement("div");
    carouselInner.classList.add("carousel-inner");
    carousel.appendChild(carouselInner);
    for (let i = 0; i < len; i++) {
      const carouselItem = document.createElement("div");
      carouselItem.classList.add("carousel-item");
      if (i === 0) {
        carouselItem.classList.add("active");
      }
      const img = document.createElement("img");
      img.src = resp[i];
      if (window.location.pathname == "/team_list") {
        img.classList.add("center-cropped-list");
      } else {
        img.classList.add("center-cropped", "rounded", "float-end");
      }
      carouselItem.appendChild(img);
      carouselInner.appendChild(carouselItem);
    }
    const prevButton = document.createElement("button");
    prevButton.classList.add("carousel-control-prev");
    prevButton.type = "button";
    prevButton.dataset.bsTarget = `#${carousel.id}`;
    prevButton.dataset.bsSlide = "prev";
    carousel.appendChild(prevButton);
    const prevIcon = document.createElement("span");
    prevIcon.classList.add("carousel-control-prev-icon");
    prevIcon.setAttribute("aria-hidden", "true");
    const prevTxt = document.createElement("span");
    prevTxt.classList.add("visually-hidden");
    prevTxt.innerHTML = "Previous";
    prevButton.appendChild(prevIcon);
    prevButton.appendChild(prevTxt);
    const nextButton = document.createElement("button");
    nextButton.classList.add("carousel-control-next");
    nextButton.type = "button";
    nextButton.dataset.bsTarget = `#${carousel.id}`;
    nextButton.dataset.bsSlide = "next";
    const nextIcon = document.createElement("span");
    nextIcon.classList.add("carousel-control-next-icon");
    nextIcon.setAttribute("aria-hidden", "true");
    const nextTxt = document.createElement("span");
    prevTxt.classList.add("visually-hidden");
    prevTxt.innerHTML = "Previous";
    nextButton.appendChild(nextIcon);
    nextButton.appendChild(nextTxt);
    carousel.appendChild(nextButton);
    document.getElementById(`${team_number}-placeholder`).replaceWith(carousel);
  }
}

async function combine_data(type) {
  let res = "";
  if (type == "current_event") {
    res = await fetch(`/api/combine_data/${type}`);
  } else if (type == "event_code") {
    res = await fetch(
      `/api/combine_data/${type}?code=${$("#event_code").val()}`
    );
  } else if (type == "range") {
    res = await fetch(
      `/api/combine_data/${type}?minDate=${$("#minDate").val()}&maxDate=${$(
        "#maxDate"
      ).val()}`
    );
  } else if (type == "selected") {
    files = [];
    $("#uploaded_list_group").childNodes.forEach(function (child) {
      if (child.childNodes[1].checked) {
        files.append(child.childNodes[1].id);
      }
    });
    res = await fetch(
      `/api/combine_data/${type}?files=${JSON.stringify(files)}`
    );
  }
  resp = await res.json();
  if (resp["success"]) {
    listItem = document.createElement("li");
    listItem.addClass("list-group-item");
    listItem.innerHTML = resp["file_name"];
    $("#processed_list_group").append(listItem);
    display_success();
  } else {
    display_error();
  }
}

async function websocket_manager(type) {
  var socket = io.connect(null, { rememberTransport: false });
  socket.on("connect", function () {
    socket.emit("connected", { data: "connected" });
    console.log("Websocket Connected, starting processing");
    switch (type) {
      case "Current":
        socket.emit("process-data", { type: "Current" });
        break;
      case "Event":
        socket.emit("process-data", {
          type: "Event",
          code: $("#event_code").val(),
        });
        break;
      case "Range":
        socket.emit("process-data", {
          type: "Range",
          start: $("#minDate").val(),
          end: $("#maxDate").val(),
        });
        break;
      case "Selected":
        files = [];
        $("#uploaded_list_group").childNodes.forEach(function (child) {
          if (child.childNodes[1].checked) {
            files.append(child.childNodes[1].id);
          }
        });
        socket.emit("process-data", { type: "Selected", files: files });
    }
  });
  socket.on("message", function (data, cb) {
    console.log(data);
    // data = JSON.parse(data);
    add_dialog(data["msg"], "yn", cb);
  });
  socket.on("process-data", function (data) {
    console.log(data);
    if (data["msg"].includes("Error")) {
      display_error();
    } else {
      add_dialog(data["msg"], "info");
    }
  });
  socket.on("disconnect", function () {});
  // socket.addEventListener("message", (event) => {
  //   event.data = JSON.parse(event.data);
  //   add_dialog(event.data["msg"], event.data["type"]);
  // });
}

// async function search_team() {
//   str = document.getElementById("team_search").value;
//   let res = await fetch('/api/search_team/' + str);
//   res = await res.json();
//   // TODO: Finish

// }

function add_dialog(string, type, cb) {
  let div = document.createElement("div");
  div.classList.add("alert", "alert-light");
  div.setAttribute("role", "alert");
  div.innerHTML = string;
  if (type == "yn") {
    btn_group = document.createElement("div");
    btn_group.classList.add("btn-group");
    yes = document.createElement("button");
    yes.classList.add("btn", "btn-primary");
    yes.innerHTML = "Yes";
    yes.id = "yes-btn";

    no = document.createElement("button");
    no.classList.add("btn", "btn-primary");
    no.innerHTML = "No";
    no.id = "no-btn";
    btn_group.appendChild(yes);
    btn_group.appendChild(no);

    div.appendChild(document.createElement("br"));
    div.appendChild(btn_group);

    yes.addEventListener("click", function () {
      cb({ answer: "yes" });
      yes.disabled = true;
      no.disabled = true;
    });

    no.addEventListener("click", function () {
      cb({ answer: "no" });
      yes.disabled = true;
      no.disabled = true;
    });
  } else if (type == "info") {
    div.classList.add("alert-info");
  }
  document.getElementById("data-correction-dialog").appendChild(div);
  var objDiv = document.getElementById("offcanvas-body");
  objDiv.scrollTop = objDiv.scrollHeight;
}

async function delete_file(type, file_name) {
  let res = await fetch("/api/delete/" + type + "/" + file_name);
  resp = await res.json();
  if (resp["success"] == "True") {
    if (type == "uploaded") {
      let list_group = document.getElementById("uploaded_list_group");
      let list_item = document.getElementById("list_uploaded_" + file_name);
      list_group.removeChild(list_item);
    } else {
      let list_group = document.getElementById("processed_list_group");
      let list_item = document.getElementById("list_processed_" + file_name);
      list_group.removeChild(list_item);
    }
    display_success();
  } else {
    display_error();
  }
}
function display_toast(message, type = "body") {
  const toastContainer = document.getElementById("toast-container");
  const toast = document.createElement("div");
  toast.classList.add("toast", "show", "fade");
  toast.setAttribute("role", "alert");
  toast.setAttribute("aria-live", "assertive");
  toast.setAttribute("aria-atomic", "true");
  toast.style.opacity = "0.85";
  toast.classList.add(`bg-${type}-subtle`);
  const toastBody = document.createElement("div");
  toastBody.classList.add("toast-body", "d-flex");
  const p = document.createElement("p");
  p.innerHTML = message;
  p.classList.add("my-auto", "flex-grow-1");
  const btn = document.createElement("button");
  btn.type = "button";
  btn.classList.add("btn-close");
  btn.setAttribute("data-bs-dismiss", "toast");
  btn.setAttribute("aria-label", "Close");
  toastBody.appendChild(p);
  toastBody.appendChild(btn);
  toast.appendChild(toastBody);
  toastContainer.appendChild(toast);
}

function display_error(action = "An error occurred") {
  display_toast(action, "danger");
}
function display_success(action = "Action completed successfully") {
  display_toast(action, "success");
}

async function syncToServer() {
  // Check if the user is online before attempting to sync
  if (!navigator.onLine) return;
  const pit_db = new Dexie("PitScoutingDB");
  pit_db.version(1).stores({ entries: "++id,team_number,team_name,synced" });
  // Sync pit scouting data
  const pitUnsynced = await pit_db.entries.where("synced").equals('false').toArray();
  if (pitUnsynced.length === 0) return;

  try {
    const res = await fetch("/pit_scouting", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(pitUnsynced)
    });
    if (res.ok) {
      await pit_db.entries.where("synced").equals('false').modify({ synced: 'true' });
      display_success("Data synced successfully");
    }
  } catch (err) {
    console.error("Sync failed:", err);
    display_error("Failed to sync data. Please try again later.");
  }

  // // Sync game scouting data
  // const game_db = new Dexie("GameScoutingDB");
  // game_db.version(1).stores({ entries: "++id,team_number,team_name,synced" });
  // const gameUnsynced = await game_db.entries.where("synced").equals('false').toArray();
  // if (gameUnsynced.length === 0) return;
  // try {
  //   const res = await fetch("/game_scouting", {
  //     method: "POST",
  //     headers: { "Content-Type": "application/json" },
  //     body: JSON.stringify(gameUnsynced)
  //   });
  //   if (res.ok) {
  //     await game_db.entries.where("synced").equals('false').modify({ synced: 'true' });
  //     display_success("Data synced successfully");
  //   }
  // } catch (err) {
  //   console.error("Sync failed:", err);
  //   display_error("Failed to sync data. Please try again later.");
  // }
}

window.addEventListener("online", syncToServer);
window.addEventListener("load", syncToServer);