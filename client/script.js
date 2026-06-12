const EVENT_API = "http://localhost:4001/graphql";
const TICKET_API = "http://localhost:4002/graphql";
const STAFF_API = "http://localhost:4003/graphql";
const SPEAKER_API = "http://localhost:4004/graphql";

const emptyForms = {
  event: () => ({
    nama_event: "",
    tanggal: "",
    waktu: "",
    lokasi: "",
    deskripsi: "",
    status_event: "Upcoming",
  }),
  ticket: () => ({
    event_id: "",
    nama_tiket: "",
    harga: 0,
    kuota: 0,
    tiket_terjual: 0,
    deskripsi: "",
  }),
  staff: () => ({
    nama_staff: "",
    divisi: "",
    no_hp: "",
    email: "",
  }),
  speaker: () => ({
    nama_speaker: "",
    instansi: "",
    bidang_keahlian: "",
    email: "",
    no_hp: "",
  }),
  staffAssignment: () => ({
    staff_id: "",
    event_id: "",
    role_tugas: "",
    status_tugas: "Active",
  }),
  speakerAssignment: () => ({
    speaker_id: "",
    event_id: "",
    judul_materi: "",
    sesi: "",
    jam_mulai: "",
    jam_selesai: "",
  }),
};

function toInt(value, fallback = 0) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function rupiah(value) {
  return `Rp ${toInt(value).toLocaleString("id-ID")}`;
}

function normalizeDate(value) {
  return value ? String(value).split("T")[0] : "";
}

function normalizeTime(value) {
  return value ? String(value).slice(0, 5) : "";
}

function truncate(value, length = 110) {
  const text = value || "";
  return text.length > length ? `${text.slice(0, length)}...` : text;
}

function normalizeText(value) {
  return String(value ?? "").toLowerCase();
}

function matchesSearch(item, fields, keyword) {
  const query = normalizeText(keyword).trim();
  if (!query) return true;
  return fields.some((field) => normalizeText(item[field]).includes(query));
}

function sortItems(items, sortBy, order = "asc") {
  if (!sortBy) return [...items];
  const direction = order === "desc" ? -1 : 1;

  return [...items].sort((a, b) => {
    const first = a[sortBy] ?? "";
    const second = b[sortBy] ?? "";

    if (!Number.isNaN(Number(first)) && !Number.isNaN(Number(second))) {
      return (Number(first) - Number(second)) * direction;
    }

    return String(first).localeCompare(String(second), "id-ID", { numeric: true, sensitivity: "base" }) * direction;
  });
}

async function graphqlRequest(endpoint, query, variables = {}) {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });

  const payload = await response.json();

  if (!response.ok || payload.errors) {
    const message = payload.errors?.map((error) => error.message).join(", ") || "GraphQL request failed";
    throw new Error(message);
  }

  return payload.data;
}

const EmptyState = {
  props: ["icon", "title", "text"],
  template: `
    <div class="empty-state">
      <i :class="'bi ' + icon"></i>
      <h3>{{ title }}</h3>
      <p>{{ text }}</p>
    </div>
  `,
};

const EventCard = {
  props: {
    event: { type: Object, required: true },
    ticketStats: { type: Object, required: true },
    showActions: { type: Boolean, default: false },
  },
  emits: ["edit", "delete"],
  methods: {
    truncate,
    rupiah,
    statusClass(status) {
      return `status-${String(status || "").toLowerCase()}`;
    },
  },
  template: `
    <article class="event-card">
      <div class="event-card-body">
        <div class="event-card-meta">
          <span class="badge pill-badge">Campus Event</span>
          <span class="badge status-badge" :class="statusClass(event.status_event)">{{ event.status_event || 'Upcoming' }}</span>
        </div>
        <small>{{ event.tanggal || 'No date' }} - {{ event.waktu || 'No time' }}</small>
        <h3>{{ event.nama_event }}</h3>
        <p><i class="bi bi-geo-alt"></i> {{ event.lokasi }}</p>
        <p class="event-desc">{{ truncate(event.deskripsi) || 'No description added.' }}</p>
        <div class="progress-row">
          <div class="progress flex-grow-1"><div class="progress-bar" :style="{ width: ticketStats.capacity + '%' }"></div></div>
          <strong>{{ ticketStats.capacity }}%</strong>
        </div>
        <div class="event-price-row">
          <span>{{ ticketStats.totalSold }} / {{ ticketStats.totalQuota }} sold</span>
          <strong>{{ rupiah(ticketStats.startingPrice) }}</strong>
        </div>
        <div v-if="showActions" class="event-actions">
          <button class="btn btn-soft" type="button" @click="$emit('edit', event)"><i class="bi bi-pencil"></i> Edit</button>
          <button class="btn btn-outline-danger" type="button" @click="$emit('delete', event.id)"><i class="bi bi-trash"></i> Delete</button>
        </div>
      </div>
    </article>
  `,
};

const DataTable = {
  props: {
    columns: { type: Array, required: true },
    rows: { type: Array, required: true },
  },
  template: `
    <div class="table-card">
      <div class="table-responsive">
        <table class="table table-hover align-middle">
          <thead>
            <tr>
              <th v-for="column in columns" :key="column.key">{{ column.label }}</th>
              <th class="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in rows" :key="row.raw.id">
              <td v-for="column in columns" :key="column.key">
                <strong v-if="column.strong">{{ row[column.key] }}</strong>
                <span v-else>{{ row[column.key] }}</span>
                <small v-if="column.subKey" class="d-block text-muted">{{ row[column.subKey] }}</small>
              </td>
              <td><div class="action-buttons"><slot name="actions" :row="row"></slot></div></td>
            </tr>
            <tr v-if="!rows.length"><td :colspan="columns.length + 1" class="text-center text-muted py-4">No data found.</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
};

const app = Vue.createApp({
  components: { EmptyState, EventCard, DataTable },
  data() {
    return {
      currentView: "dashboard",
      sidebarOpen: false,
      loading: false,
      filters: {
        events: { search: "", status: "", sortBy: "tanggal", order: "asc" },
        tickets: { search: "", sortBy: "nama_tiket", order: "asc" },
        staff: { search: "", sortBy: "nama_staff", order: "asc" },
        speakers: { search: "", sortBy: "nama_speaker", order: "asc" },
        assignments: { search: "" },
      },
      feedback: { type: "success", message: "" },
      events: [],
      ticketCategories: [],
      staffs: [],
      speakers: [],
      staffAssignments: [],
      speakerAssignments: [],
      editing: { event: null, ticket: null, staff: null, speaker: null },
      forms: {
        event: emptyForms.event(),
        ticket: emptyForms.ticket(),
        staff: emptyForms.staff(),
        speaker: emptyForms.speaker(),
        staffAssignment: emptyForms.staffAssignment(),
        speakerAssignment: emptyForms.speakerAssignment(),
      },
      modals: {},
      navItems: [
        { key: "dashboard", label: "Dashboard", icon: "bi bi-grid-1x2" },
        { key: "events", label: "Events", icon: "bi bi-ticket-perforated" },
        { key: "tickets", label: "Ticket Categories", icon: "bi bi-tags" },
        { key: "staff", label: "Staff Management", icon: "bi bi-people" },
        { key: "speakers", label: "Speaker Management", icon: "bi bi-mic" },
        { key: "assignments", label: "Assignments", icon: "bi bi-diagram-3" },
      ],
      ticketColumns: [
        { key: "nama_tiket", label: "Ticket", strong: true, subKey: "deskripsi" },
        { key: "event_name", label: "Event" },
        { key: "harga", label: "Price" },
        { key: "kuota", label: "Quota" },
        { key: "tiket_terjual", label: "Sold" },
        { key: "remaining", label: "Remaining" },
      ],
      staffColumns: [
        { key: "nama_staff", label: "Name", strong: true },
        { key: "divisi", label: "Division" },
        { key: "no_hp", label: "Phone" },
        { key: "email", label: "Email" },
      ],
      speakerColumns: [
        { key: "nama_speaker", label: "Speaker", strong: true },
        { key: "instansi", label: "Institution" },
        { key: "bidang_keahlian", label: "Expertise" },
        { key: "email", label: "Email", subKey: "no_hp" },
      ],
    };
  },
  computed: {
    currentTitle() {
      return this.navItems.find((item) => item.key === this.currentView)?.label || "Dashboard";
    },
    upcomingEvents() {
      return this.events.filter((event) => event.status_event === "Upcoming").slice(0, 6);
    },
    filteredEvents() {
      const filters = this.filters.events;
      const filtered = this.events.filter((event) => {
        const statusMatches = !filters.status || normalizeText(event.status_event) === normalizeText(filters.status);
        return statusMatches && matchesSearch(event, ["nama_event", "lokasi", "deskripsi", "status_event"], filters.search);
      });

      return sortItems(filtered, filters.sortBy, filters.order);
    },
    filteredTicketCategories() {
      const filters = this.filters.tickets;
      const rows = this.ticketCategories.map((item) => ({
        ...item,
        event_name: this.getEventName(item.event_id),
      }));
      const filtered = rows.filter((item) =>
        matchesSearch(item, ["nama_tiket", "event_name", "harga", "kuota", "tiket_terjual", "deskripsi"], filters.search)
      );

      return sortItems(filtered, filters.sortBy, filters.order);
    },
    filteredStaffs() {
      const filters = this.filters.staff;
      const filtered = this.staffs.filter((item) => matchesSearch(item, ["nama_staff", "divisi", "no_hp", "email"], filters.search));
      return sortItems(filtered, filters.sortBy, filters.order);
    },
    filteredSpeakers() {
      const filters = this.filters.speakers;
      const filtered = this.speakers.filter((item) =>
        matchesSearch(item, ["nama_speaker", "instansi", "bidang_keahlian", "email", "no_hp"], filters.search)
      );
      return sortItems(filtered, filters.sortBy, filters.order);
    },
    filteredStaffAssignments() {
      return this.staffAssignments
        .map((item) => ({
          ...item,
          staff_name: this.getStaffName(item.staff_id),
          event_name: this.getEventName(item.event_id),
        }))
        .filter((item) =>
          matchesSearch(item, ["staff_name", "event_name", "role_tugas", "status_tugas"], this.filters.assignments.search)
        );
    },
    filteredSpeakerAssignments() {
      return this.speakerAssignments
        .map((item) => ({
          ...item,
          speaker_name: this.getSpeakerName(item.speaker_id),
          event_name: this.getEventName(item.event_id),
        }))
        .filter((item) =>
          matchesSearch(
            item,
            ["speaker_name", "event_name", "judul_materi", "sesi", "jam_mulai", "jam_selesai"],
            this.filters.assignments.search
          )
        );
    },
    ticketRows() {
      return this.filteredTicketCategories.map((item) => ({
        ...item,
        harga: rupiah(item.harga),
        remaining: Math.max(0, toInt(item.kuota) - toInt(item.tiket_terjual)),
        raw: item,
      }));
    },
    staffRows() {
      return this.filteredStaffs.map((item) => ({ ...item, raw: item }));
    },
    speakerRows() {
      return this.filteredSpeakers.map((item) => ({ ...item, raw: item }));
    },
    activeStaffAssignments() {
      return this.staffAssignments.filter((item) => item.status_tugas === "Active").length;
    },
  },
  methods: {
    goTo(view) {
      this.currentView = view;
      this.sidebarOpen = false;
      window.location.hash = view;
    },
    showFeedback(type, message) {
      this.feedback = { type, message };
      window.clearTimeout(this.feedbackTimer);
      this.feedbackTimer = window.setTimeout(() => {
        this.feedback.message = "";
      }, 4200);
    },
    resetFilters(view) {
      const defaults = {
        events: { search: "", status: "", sortBy: "tanggal", order: "asc" },
        tickets: { search: "", sortBy: "nama_tiket", order: "asc" },
        staff: { search: "", sortBy: "nama_staff", order: "asc" },
        speakers: { search: "", sortBy: "nama_speaker", order: "asc" },
        assignments: { search: "" },
      };

      this.filters[view] = { ...defaults[view] };
    },
    async run(action, successMessage, errorPrefix) {
      try {
        this.loading = true;
        await action();
        if (successMessage) this.showFeedback("success", successMessage);
      } catch (error) {
        console.error(error);
        this.showFeedback("danger", `${errorPrefix}: ${error.message}`);
      } finally {
        this.loading = false;
      }
    },
    async loadAll() {
      await Promise.all([this.loadEvents(), this.loadTicketCategories(), this.loadStaffs(), this.loadSpeakers(), this.loadAssignments()]);
    },
    async loadEvents() {
      await this.run(async () => {
        const data = await graphqlRequest(
          EVENT_API,
          `query ($search: String, $status: String, $sortBy: String, $order: String) {
            events(search: $search, status: $status, sort_by: $sortBy, order: $order) {
              id nama_event tanggal waktu lokasi deskripsi status_event
            }
          }`,
          { search: "", status: "", sortBy: "date", order: "asc" }
        );
        this.events = data.events || [];
      }, "", "Events error");
    },
    async loadTicketCategories() {
      await this.run(async () => {
        const data = await graphqlRequest(
          TICKET_API,
          `query ($search: String, $sortBy: String, $order: String) {
            ticketCategories(search: $search, sort_by: $sortBy, order: $order) {
              id event_id nama_tiket harga kuota tiket_terjual deskripsi
            }
          }`,
          { search: "", sortBy: "name", order: "asc" }
        );
        this.ticketCategories = data.ticketCategories || [];
      }, "", "Tickets error");
    },
    async loadStaffs() {
      await this.run(async () => {
        const data = await graphqlRequest(
          STAFF_API,
          `query ($search: String, $sortBy: String, $order: String) {
            staffs(search: $search, sort_by: $sortBy, order: $order) {
              id nama_staff divisi no_hp email
            }
          }`,
          { search: "", sortBy: "name", order: "asc" }
        );
        this.staffs = data.staffs || [];
      }, "", "Staffs error");
    },
    async loadSpeakers() {
      await this.run(async () => {
        const data = await graphqlRequest(
          SPEAKER_API,
          `query ($search: String, $sortBy: String, $order: String) {
            speakers(search: $search, sort_by: $sortBy, order: $order) {
              id nama_speaker instansi bidang_keahlian email no_hp
            }
          }`,
          { search: "", sortBy: "name", order: "asc" }
        );
        this.speakers = data.speakers || [];
      }, "", "Speakers error");
    },
    async loadAssignments() {
      await this.run(async () => {
        const [staffData, speakerData] = await Promise.all([
          graphqlRequest(STAFF_API, `query { staffAssignments { id staff_id event_id role_tugas status_tugas } }`),
          graphqlRequest(SPEAKER_API, `query { speakerAssignments { id speaker_id event_id judul_materi sesi jam_mulai jam_selesai } }`),
        ]);
        this.staffAssignments = staffData.staffAssignments || [];
        this.speakerAssignments = speakerData.speakerAssignments || [];
      }, "", "Assignments error");
    },
    getEventName(id) {
      return this.events.find((event) => String(event.id) === String(id))?.nama_event || `Event ${id}`;
    },
    getStaffName(id) {
      return this.staffs.find((staff) => String(staff.id) === String(id))?.nama_staff || `Staff ${id}`;
    },
    getSpeakerName(id) {
      return this.speakers.find((speaker) => String(speaker.id) === String(id))?.nama_speaker || `Speaker ${id}`;
    },
    ticketStatsForEvent(eventId) {
      const tickets = this.ticketCategories.filter((ticket) => String(ticket.event_id) === String(eventId));
      const totalQuota = tickets.reduce((sum, ticket) => sum + toInt(ticket.kuota), 0);
      const totalSold = tickets.reduce((sum, ticket) => sum + toInt(ticket.tiket_terjual), 0);
      const startingPrice = tickets.length ? Math.min(...tickets.map((ticket) => toInt(ticket.harga))) : 0;
      const capacity = totalQuota ? Math.min(100, Math.round((totalSold / totalQuota) * 100)) : 0;
      return { totalQuota, totalSold, startingPrice, capacity };
    },
    resetEventForm() {
      this.editing.event = null;
      this.forms.event = emptyForms.event();
    },
    openEventModal(item = null) {
      if (item) {
        this.editing.event = item.id;
        this.forms.event = {
          nama_event: item.nama_event || "",
          tanggal: normalizeDate(item.tanggal),
          waktu: normalizeTime(item.waktu),
          lokasi: item.lokasi || "",
          deskripsi: item.deskripsi || "",
          status_event: item.status_event || "Upcoming",
        };
      } else {
        this.resetEventForm();
      }
      this.modals.event.show();
    },
    async saveEvent() {
      const input = { ...this.forms.event };
      await this.run(async () => {
        if (this.editing.event) {
          await graphqlRequest(EVENT_API, `mutation ($id: ID!, $input: EventInput!) { updateEvent(id: $id, input: $input) { id } }`, { id: this.editing.event, input });
        } else {
          await graphqlRequest(EVENT_API, `mutation ($input: EventInput!) { createEvent(input: $input) { id } }`, { input });
        }
        this.modals.event.hide();
        this.resetEventForm();
        await this.loadEvents();
      }, "Event saved successfully.", "Save event error");
    },
    async deleteEvent(id) {
      if (!confirm("Delete this event?")) return;
      await this.run(async () => {
        await graphqlRequest(EVENT_API, `mutation ($id: ID!) { deleteEvent(id: $id) }`, { id });
        await this.loadEvents();
      }, "Event deleted.", "Delete event error");
    },
    resetTicketForm() {
      this.editing.ticket = null;
      this.forms.ticket = emptyForms.ticket();
    },
    openTicketModal(item = null) {
      if (item) {
        this.editing.ticket = item.id;
        this.forms.ticket = {
          event_id: item.event_id || "",
          nama_tiket: item.nama_tiket || "",
          harga: toInt(item.harga),
          kuota: toInt(item.kuota),
          tiket_terjual: toInt(item.tiket_terjual),
          deskripsi: item.deskripsi || "",
        };
      } else {
        this.resetTicketForm();
      }
      this.modals.ticket.show();
    },
    async saveTicket() {
      const input = {
        ...this.forms.ticket,
        harga: toInt(this.forms.ticket.harga),
        kuota: toInt(this.forms.ticket.kuota),
        tiket_terjual: toInt(this.forms.ticket.tiket_terjual),
      };
      await this.run(async () => {
        if (this.editing.ticket) {
          await graphqlRequest(TICKET_API, `mutation ($id: ID!, $input: TicketCategoryInput!) { updateTicketCategory(id: $id, input: $input) { id } }`, { id: this.editing.ticket, input });
        } else {
          await graphqlRequest(TICKET_API, `mutation ($input: TicketCategoryInput!) { createTicketCategory(input: $input) { id } }`, { input });
        }
        this.modals.ticket.hide();
        this.resetTicketForm();
        await this.loadTicketCategories();
      }, "Ticket saved successfully.", "Save ticket error");
    },
    async deleteTicketCategory(id) {
      if (!confirm("Delete this ticket category?")) return;
      await this.run(async () => {
        await graphqlRequest(TICKET_API, `mutation ($id: ID!) { deleteTicketCategory(id: $id) }`, { id });
        await this.loadTicketCategories();
      }, "Ticket deleted.", "Delete ticket error");
    },
    resetStaffForm() {
      this.editing.staff = null;
      this.forms.staff = emptyForms.staff();
    },
    openStaffModal(item = null) {
      if (item) {
        this.editing.staff = item.id;
        this.forms.staff = {
          nama_staff: item.nama_staff || "",
          divisi: item.divisi || "",
          no_hp: item.no_hp || "",
          email: item.email || "",
        };
      } else {
        this.resetStaffForm();
      }
      this.modals.staff.show();
    },
    async saveStaff() {
      const input = { ...this.forms.staff };
      await this.run(async () => {
        if (this.editing.staff) {
          await graphqlRequest(STAFF_API, `mutation ($id: ID!, $input: StaffInput!) { updateStaff(id: $id, input: $input) { id } }`, { id: this.editing.staff, input });
        } else {
          await graphqlRequest(STAFF_API, `mutation ($input: StaffInput!) { createStaff(input: $input) { id } }`, { input });
        }
        this.modals.staff.hide();
        this.resetStaffForm();
        await this.loadStaffs();
      }, "Staff saved successfully.", "Save staff error");
    },
    async deleteStaff(id) {
      if (!confirm("Delete this staff member?")) return;
      await this.run(async () => {
        await graphqlRequest(STAFF_API, `mutation ($id: ID!) { deleteStaff(id: $id) }`, { id });
        await this.loadStaffs();
      }, "Staff deleted.", "Delete staff error");
    },
    resetSpeakerForm() {
      this.editing.speaker = null;
      this.forms.speaker = emptyForms.speaker();
    },
    openSpeakerModal(item = null) {
      if (item) {
        this.editing.speaker = item.id;
        this.forms.speaker = {
          nama_speaker: item.nama_speaker || "",
          instansi: item.instansi || "",
          bidang_keahlian: item.bidang_keahlian || "",
          email: item.email || "",
          no_hp: item.no_hp || "",
        };
      } else {
        this.resetSpeakerForm();
      }
      this.modals.speaker.show();
    },
    async saveSpeaker() {
      const input = { ...this.forms.speaker };
      await this.run(async () => {
        if (this.editing.speaker) {
          await graphqlRequest(SPEAKER_API, `mutation ($id: ID!, $input: SpeakerInput!) { updateSpeaker(id: $id, input: $input) { id } }`, { id: this.editing.speaker, input });
        } else {
          await graphqlRequest(SPEAKER_API, `mutation ($input: SpeakerInput!) { createSpeaker(input: $input) { id } }`, { input });
        }
        this.modals.speaker.hide();
        this.resetSpeakerForm();
        await this.loadSpeakers();
      }, "Speaker saved successfully.", "Save speaker error");
    },
    async deleteSpeaker(id) {
      if (!confirm("Delete this speaker?")) return;
      await this.run(async () => {
        await graphqlRequest(SPEAKER_API, `mutation ($id: ID!) { deleteSpeaker(id: $id) }`, { id });
        await this.loadSpeakers();
      }, "Speaker deleted.", "Delete speaker error");
    },
    async saveStaffAssignment() {
      const input = { ...this.forms.staffAssignment };
      await this.run(async () => {
        await graphqlRequest(STAFF_API, `mutation ($input: StaffAssignmentInput!) { createStaffAssignment(input: $input) { id } }`, { input });
        this.forms.staffAssignment = emptyForms.staffAssignment();
        await this.loadAssignments();
      }, "Staff assignment saved.", "Save staff assignment error");
    },
    async saveSpeakerAssignment() {
      const input = { ...this.forms.speakerAssignment };
      await this.run(async () => {
        await graphqlRequest(SPEAKER_API, `mutation ($input: SpeakerAssignmentInput!) { createSpeakerAssignment(input: $input) { id } }`, { input });
        this.forms.speakerAssignment = emptyForms.speakerAssignment();
        await this.loadAssignments();
      }, "Speaker assignment saved.", "Save speaker assignment error");
    },
  },
  mounted() {
    this.modals = {
      event: new bootstrap.Modal(document.getElementById("eventModal")),
      ticket: new bootstrap.Modal(document.getElementById("ticketModal")),
      staff: new bootstrap.Modal(document.getElementById("staffModal")),
      speaker: new bootstrap.Modal(document.getElementById("speakerModal")),
    };

    const initialHash = window.location.hash.replace("#", "");
    if (this.navItems.some((item) => item.key === initialHash)) {
      this.currentView = initialHash;
    }

    this.loadAll();
  },
});

app.mount("#app");
