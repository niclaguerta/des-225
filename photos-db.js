/* ============================================================
   Photo storage, shared by the installation and gallery.html.
   Photos are kept in this browser on this computer (IndexedDB).
   Nothing is uploaded. Download them from gallery.html to keep copies.
   ============================================================ */
const PhotoDB = (() => {
  const NAME = "silhouette-photos";
  const STORE = "photos";
  let opening;

  function open() {
    return (opening ??= new Promise((resolve, reject) => {
      const req = indexedDB.open(NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE, { keyPath: "id", autoIncrement: true });
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }));
  }

  async function run(mode, action) {
    const db = await open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const req = action(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = () => reject(tx.error);
    });
  }

  // Lets an open gallery tab refresh when the installation saves a new photo
  const channel = "BroadcastChannel" in window ? new BroadcastChannel(NAME) : null;
  const changed = (result) => { channel?.postMessage("changed"); return result; };

  // Ask the browser not to clear these photos when the disk gets full
  navigator.storage?.persist?.();

  return {
    add: (photo) => run("readwrite", (s) => s.add(photo)).then(changed), // { time, scene, blob }
    all: () => run("readonly", (s) => s.getAll()),
    remove: (id) => run("readwrite", (s) => s.delete(id)).then(changed),
    clear: () => run("readwrite", (s) => s.clear()).then(changed),
    onChange: (fn) => channel?.addEventListener("message", fn),
  };
})();
