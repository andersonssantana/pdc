import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import { CustomersCollection } from "/imports/api/customers";
import { NotesCollection } from "/imports/api/notes";
import { ROLES, isAdmin } from "/imports/api/users";
import fs from 'fs';
import os from "os";
import { Worker } from "worker_threads";

let stressMemoryBalloon = null;
let stressMemoryTimer = null;
let stressRunning = false;

async function seedAdminUser() {
  const existingAdmin = await Accounts.findUserByUsername("admin");
  if (!existingAdmin) {
    await Accounts.createUserAsync({
      username: "admin",
      password: "admin123",
      profile: {
        name: "Administrator",
        role: ROLES.ADMIN
      }
    });
    console.log("Admin user created: admin/admin123");
  }
}

// Publications (registered synchronously at module load time)
Meteor.publish("customers", function () {
  if (!this.userId) {
    return this.ready();
  }
  return CustomersCollection.find();
});

Meteor.publish("notes.byCustomer", function (customerId) {
  if (!this.userId) {
    return this.ready();
  }
  return NotesCollection.find({ customerId });
});

Meteor.publish("users.all", async function () {
  if (!this.userId) {
    return this.ready();
  }
  const user = await Meteor.users.findOneAsync(this.userId);
  if (!isAdmin(user)) {
    return this.ready();
  }
  return Meteor.users.find({}, {
    fields: {
      username: 1,
      profile: 1,
      createdAt: 1
    }
  });
});

// Startup: seed data only
Meteor.startup(async () => {
  console.log("Meteor Startup");
  await seedAdminUser();
      try {
    const certPath = Assets.absoluteFilePath('certificate.crt');
    console.log('[TLS Debug] Resolved path:', certPath);
    console.log('[TLS Debug] File exists:', fs.existsSync(certPath));
  } catch (e) {
    console.log('[TLS Debug] Assets error:', e.message);
  }
});

Meteor.methods({
  async "customers.insert"(customerData) {
    if (!this.userId) {
      throw new Meteor.Error("not-authorized", "You must be logged in");
    }

    const { name, phones, description, notes } = customerData;

    if (!name || name.trim() === "") {
      throw new Meteor.Error("invalid-data", "Customer name is required");
    }

    const normalizedPhones = (Array.isArray(phones) ? phones : [])
      .map(p => p?.trim())
      .filter(p => p);

    const user = await Meteor.users.findOneAsync(this.userId);
    const userName = user?.profile?.name || user?.username || "Unknown";

    const result = await CustomersCollection.insertAsync({
      name: name.trim(),
      phone: normalizedPhones[0] || "",
      phones: normalizedPhones,
      description: description?.trim() || "",
      notes: notes?.trim() || "",
      createdAt: new Date(),
      createdBy: this.userId,
      createdByName: userName,
      updatedAt: new Date(),
      updatedBy: this.userId,
      updatedByName: userName
    });
    console.log(`[customers.insert] Customer created: "${name.trim()}" by ${userName}`);
    return result;
  },

  async "customers.update"(customerId, customerData) {
    if (!this.userId) {
      throw new Meteor.Error("not-authorized", "You must be logged in");
    }

    const { name, phones, description, notes } = customerData;

    if (!name || name.trim() === "") {
      throw new Meteor.Error("invalid-data", "Customer name is required");
    }

    const customer = await CustomersCollection.findOneAsync(customerId);
    if (!customer) {
      throw new Meteor.Error("not-found", "Customer not found");
    }

    const normalizedPhones = (Array.isArray(phones) ? phones : [])
      .map(p => p?.trim())
      .filter(p => p);

    const user = await Meteor.users.findOneAsync(this.userId);
    const userName = user?.profile?.name || user?.username || "Unknown";

    const result = await CustomersCollection.updateAsync(customerId, {
      $set: {
        name: name.trim(),
        phone: normalizedPhones[0] || "",
        phones: normalizedPhones,
        description: description?.trim() || "",
        notes: notes?.trim() || "",
        updatedAt: new Date(),
        updatedBy: this.userId,
        updatedByName: userName
      }
    });
    console.log(`[customers.update] Customer updated: "${name.trim()}" (${customerId}) by ${userName}`);
    return result;
  },

  async "customers.remove"(customerId) {
    if (!this.userId) {
      throw new Meteor.Error("not-authorized", "You must be logged in");
    }

    const user = await Meteor.users.findOneAsync(this.userId);
    if (!isAdmin(user)) {
      throw new Meteor.Error("not-authorized", "Only admins can delete customers");
    }

    // Also delete all notes for this customer
    await NotesCollection.removeAsync({ customerId });

    const result = await CustomersCollection.removeAsync(customerId);
    console.log(`[customers.remove] Customer removed: ${customerId} by ${user?.profile?.name || user?.username}`);
    return result;
  },

  async "notes.insert"(noteData) {
    if (!this.userId) {
      throw new Meteor.Error("not-authorized", "You must be logged in");
    }

    const { customerId, content } = noteData;

    if (!content || content.trim() === "") {
      throw new Meteor.Error("invalid-data", "Note content is required");
    }

    const customer = await CustomersCollection.findOneAsync(customerId);
    if (!customer) {
      throw new Meteor.Error("not-found", "Customer not found");
    }

    const user = await Meteor.users.findOneAsync(this.userId);
    const createdByName = user?.profile?.name || user?.username || "Unknown";

    const result = await NotesCollection.insertAsync({
      customerId,
      content: content.trim(),
      createdAt: new Date(),
      createdBy: this.userId,
      createdByName
    });
    console.log(`[notes.insert] Note added to customer ${customerId} by ${createdByName}`);
    return result;
  },

  async "notes.remove"(noteId) {
    if (!this.userId) {
      throw new Meteor.Error("not-authorized", "You must be logged in");
    }

    const note = await NotesCollection.findOneAsync(noteId);
    if (!note) {
      throw new Meteor.Error("not-found", "Note not found");
    }

    const user = await Meteor.users.findOneAsync(this.userId);
    const isOwner = note.createdBy === this.userId;

    if (!isOwner && !isAdmin(user)) {
      throw new Meteor.Error("not-authorized", "You can only delete your own notes");
    }

    const result = await NotesCollection.removeAsync(noteId);
    console.log(`[notes.remove] Note removed: ${noteId} by ${user?.profile?.name || user?.username}`);
    return result;
  },

  async "users.create"(userData) {
    if (!this.userId) {
      throw new Meteor.Error("not-authorized", "You must be logged in");
    }

    const currentUser = await Meteor.users.findOneAsync(this.userId);
    if (!isAdmin(currentUser)) {
      throw new Meteor.Error("not-authorized", "Only admins can create users");
    }

    const { username, password, name } = userData;

    if (!username || username.trim() === "") {
      throw new Meteor.Error("invalid-data", "Username is required");
    }

    if (!password || password.length < 6) {
      throw new Meteor.Error("invalid-data", "Password must be at least 6 characters");
    }

    if (!name || name.trim() === "") {
      throw new Meteor.Error("invalid-data", "Name is required");
    }

    const existingUser = await Accounts.findUserByUsername(username.trim());
    if (existingUser) {
      throw new Meteor.Error("invalid-data", "Username already exists");
    }

    const result = await Accounts.createUserAsync({
      username: username.trim(),
      password,
      profile: {
        name: name.trim(),
        role: ROLES.USER
      }
    });
    console.log(`[users.create] New user created: ${username.trim()} (${name.trim()}) by ${currentUser?.profile?.name || currentUser?.username}`);
    return result;
  },

  async "users.remove"(userId) {
    if (!this.userId) {
      throw new Meteor.Error("not-authorized", "You must be logged in");
    }

    const currentUser = await Meteor.users.findOneAsync(this.userId);
    if (!isAdmin(currentUser)) {
      throw new Meteor.Error("not-authorized", "Only admins can delete users");
    }

    if (userId === this.userId) {
      throw new Meteor.Error("invalid-operation", "You cannot delete yourself");
    }

    const userToDelete = await Meteor.users.findOneAsync(userId);
    if (!userToDelete) {
      throw new Meteor.Error("not-found", "User not found");
    }

    const result = await Meteor.users.removeAsync(userId);
    console.log(`[users.remove] User removed: ${userToDelete.username} by ${currentUser?.profile?.name || currentUser?.username}`);
    return result;
  },

  async "users.setPassword"(userId, newPassword) {
    if (!this.userId) {
      throw new Meteor.Error("not-authorized", "You must be logged in");
    }

    const currentUser = await Meteor.users.findOneAsync(this.userId);
    if (!isAdmin(currentUser)) {
      throw new Meteor.Error("not-authorized", "Only admins can reset passwords");
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Meteor.Error("invalid-data", "Password must be at least 6 characters");
    }

    const userToUpdate = await Meteor.users.findOneAsync(userId);
    if (!userToUpdate) {
      throw new Meteor.Error("not-found", "User not found");
    }

    await Accounts.setPasswordAsync(userId, newPassword);
    console.log(`[users.setPassword] Password reset for: ${userToUpdate.username} by ${currentUser?.profile?.name || currentUser?.username}`);
    return true;
  },

  async "system.stressTest"(options = {}) {
    if (!this.userId) {
      throw new Meteor.Error("not-authorized", "You must be logged in");
    }

    const currentUser = await Meteor.users.findOneAsync(this.userId);
    if (!isAdmin(currentUser)) {
      throw new Meteor.Error("not-authorized", "Only admins can run the stress test");
    }

    const { cpu = true, memory = true } = options;
    if (!cpu && !memory) {
      throw new Meteor.Error("invalid-data", "Enable CPU and/or memory stress");
    }

    const durationSeconds = options.durationSeconds ?? 10;
    if (!Number.isFinite(durationSeconds) || durationSeconds < 1 || durationSeconds > 30) {
      throw new Meteor.Error("invalid-data", "durationSeconds must be between 1 and 30");
    }

    const maxWorkers = os.cpus().length;
    const workers = options.workers ?? Math.min(2, maxWorkers);
    if (!Number.isInteger(workers) || workers < 1 || workers > maxWorkers) {
      throw new Meteor.Error("invalid-data", `workers must be between 1 and ${maxWorkers}`);
    }

    const memoryMb = options.memoryMb ?? 256;
    if (!Number.isFinite(memoryMb) || memoryMb < 1 || memoryMb > 512) {
      throw new Meteor.Error("invalid-data", "memoryMb must be between 1 and 512");
    }

    if (stressRunning) {
      throw new Meteor.Error("invalid-operation", "A stress test is already running");
    }
    stressRunning = true;

    const durationMs = durationSeconds * 1000;
    const before = process.memoryUsage();
    console.log(
      `[system.stressTest] START cpu=${cpu} workers=${workers} memory=${memory} memoryMb=${memoryMb} durationSeconds=${durationSeconds} ` +
      `rssBefore=${Math.round(before.rss / 1048576)}MB by ${currentUser?.profile?.name || currentUser?.username}`
    );

    try {
      if (memory) {
        stressMemoryBalloon = Buffer.alloc(memoryMb * 1048576, 1);
        if (stressMemoryTimer) clearTimeout(stressMemoryTimer);
        stressMemoryTimer = setTimeout(() => {
          stressMemoryBalloon = null;
          stressMemoryTimer = null;
        }, durationMs);
      }

      const workerPromises = [];
      if (cpu) {
        const workerSource = `
          const { workerData } = require('worker_threads');
          const end = Date.now() + workerData.durationMs;
          let x = 0;
          while (Date.now() < end) {
            for (let i = 0; i < 1e6; i++) { x += Math.sqrt(i) * Math.sin(i); }
          }
        `;
        for (let i = 0; i < workers; i++) {
          workerPromises.push(new Promise((resolve) => {
            const w = new Worker(workerSource, { eval: true, workerData: { durationMs } });
            w.on("exit", () => resolve());
            w.on("error", () => resolve());
          }));
        }
      }

      await Promise.all(workerPromises);
      if (!cpu && memory) {
        await new Promise((resolve) => setTimeout(resolve, durationMs));
      }

      const after = process.memoryUsage();
      console.log(
        `[system.stressTest] DONE rssAfter=${Math.round(after.rss / 1048576)}MB ` +
        `heapUsed=${Math.round(after.heapUsed / 1048576)}MB`
      );
      return {
        ok: true,
        durationSeconds,
        workers: cpu ? workers : 0,
        memoryMb: memory ? memoryMb : 0,
        rssBeforeMb: Math.round(before.rss / 1048576),
        rssAfterMb: Math.round(after.rss / 1048576),
      };
    } finally {
      stressRunning = false;
    }
  }
});
