const URL = 'https://script.google.com/macros/s/AKfycbyDJyLnEnpLyT-uFEotxdz4neBU9Nw38Qgr25o98Rmx9TMyB19L2zMgMxolI_dbFDx_mQ/exec';

document.getElementById("formulario").addEventListener("submit", async (e) => {
  e.preventDefault();

  const fecha        = document.getElementById("fecha").value;
  const hora         = document.getElementById("hora").value;
  const especialidad = document.getElementById("especialidad").value.trim();
  const lugar        = document.getElementById("lugar").value.trim();
  const paciente     = document.getElementById("paciente").value.trim();
  const responsable  = document.getElementById("responsable").value.trim();

  if (!fecha || !hora || !especialidad || !lugar || !paciente || !responsable) {
    alert("Por favor, completa todos los campos.");
    return;
  }

  const formData = new URLSearchParams();
  formData.append("fechaCita", fecha);
  formData.append("horaCita", hora);
  formData.append("especialidad", especialidad);
  formData.append("lugar", lugar);
  formData.append("paciente", paciente);
  formData.append("responsable", responsable);

  try {
    const res = await fetch(URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });

    const resData = await res.json();

    if (res.ok && resData.status === "OK") {
      alert("✅ Consulta guardada exitosamente");
      document.getElementById("formulario").reset();
      obtenerConsultas();
    } else if (resData.error) {
      alert("⚠️ Error en servidor: " + resData.error);
    } else {
      alert("⚠️ Respuesta inesperada del servidor. Revisa consola.");
      console.log("Respuesta inesperada:", resData);
    }
  } catch (err) {
    console.error("❌ Error al guardar consulta:", err);
    alert("❌ Ocurrió un error al conectar con el servidor");
  }
});

function formatearFecha(fecha) {
  if (!fecha) return '';
  if (typeof fecha === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fecha)) return fecha;
  const d = new Date(fecha);
  if (isNaN(d)) return fecha;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatearHora(hora) {
  if (!hora) return '';
  if (typeof hora === 'string' && /^\d{2}:\d{2}$/.test(hora)) return hora;
  const d = new Date(hora);
  if (isNaN(d)) return hora;
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

async function obtenerConsultas() {
  const tabla = document.querySelector("#tabla tbody");
  tabla.innerHTML = "";

  try {
    const res = await fetch(URL);
    if (!res.ok) throw new Error(`Error HTTP: ${res.status}`);

    const data = await res.json();

    if (!Array.isArray(data)) throw new Error("La respuesta no es una lista válida");

    for (let i = 1; i < data.length; i++) {
      let [fCita, hCita, esp, lug, pac, resp] = data[i];
      const filaSheet = i + 1;

      fCita = formatearFecha(fCita);
      hCita = formatearHora(hCita);

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${fCita}</td>
        <td>${hCita}</td>
        <td>${esp}</td>
        <td>${lug}</td>
        <td>${pac}</td>
        <td>${resp}</td>
        <td><button class="btn-eliminar" data-row="${filaSheet}">Eliminar</button></td>
      `;
      tabla.appendChild(tr);
    }

    document.querySelectorAll(".btn-eliminar").forEach(btn => {
      btn.addEventListener("click", async () => {
        const row = btn.getAttribute("data-row");
        if (confirm(`¿Eliminar la fila ${row - 1} de consultas?`)) {
          try {
            const formData = new URLSearchParams();
            formData.append("action", "delete");
            formData.append("row", row);

            const res = await fetch(URL, {
              method: "POST",
              body: formData.toString(),
              headers: { "Content-Type": "application/x-www-form-urlencoded" }
            });

            const resData = await res.json();

            if (res.ok && resData.status === "OK") {
              alert("✅ Consulta eliminada");
              obtenerConsultas();
            } else {
              alert("⚠️ Error al eliminar: " + (resData.error || "Respuesta inesperada"));
            }
          } catch (error) {
            alert("❌ Error de conexión al eliminar");
            console.error(error);
          }
        }
      });
    });

  } catch (err) {
    console.error("❌ Error al obtener datos:", err);
    alert("⚠️ No se pudieron cargar los datos. Revisa la consola.");
  }
}

obtenerConsultas();
