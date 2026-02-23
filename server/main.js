import { Meteor } from "meteor/meteor";
import { Accounts } from "meteor/accounts-base";
import { LinksCollection } from "/imports/api/links";
import { CustomersCollection } from "/imports/api/customers";
import { NotesCollection } from "/imports/api/notes";
import { ROLES, isAdmin } from "/imports/api/users";
import { Random } from "meteor/random";

async function insertLink({ title, url }) {
  await LinksCollection.insertAsync({ title, url, createdAt: new Date() });
}

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
Meteor.publish("links", function () {
  return LinksCollection.find();
});

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
  // Seed admin user
  await seedAdminUser();

  // If the Links collection is empty, add some data.
  if ((await LinksCollection.find().countAsync()) === 0) {
    await insertLink({
      title: "Do the Tutorial",
      url: "https://docs.meteor.com/tutorials/react/",
    });

    await insertLink({
      title: "Follow the Guide",
      url: "https://docs.meteor.com/tutorials/application-structure/",
    });

    await insertLink({
      title: "Read the Docs",
      url: "https://docs.meteor.com",
    });

    await insertLink({
      title: "Discussions",
      url: "https://forums.meteor.com",
    });

    await insertLink({
      title: "Join us on Discord",
      url: "https://discord.gg/6mS3wHNg",
    });

    await insertLink({
      title: "Deploying in Galaxy",
      url: "https://www.meteor.com/hosting",
    });
  }
});

Meteor.methods({
  about() {
    return `This is a Meteor application running React with React Router. this is a generated id: ${Random.id()}`;
  },

  async "customers.insert"(customerData) {
    if (!this.userId) {
      throw new Meteor.Error("not-authorized", "You must be logged in");
    }

    const { name, email, phone, company, address } = customerData;

    if (!name || name.trim() === "") {
      throw new Meteor.Error("invalid-data", "Customer name is required");
    }

    return await CustomersCollection.insertAsync({
      name: name.trim(),
      email: email?.trim() || "",
      phone: phone?.trim() || "",
      company: company?.trim() || "",
      address: address?.trim() || "",
      createdAt: new Date(),
      createdBy: this.userId,
      updatedAt: new Date()
    });
  },

  async "customers.update"(customerId, customerData) {
    if (!this.userId) {
      throw new Meteor.Error("not-authorized", "You must be logged in");
    }

    const { name, email, phone, company, address } = customerData;

    if (!name || name.trim() === "") {
      throw new Meteor.Error("invalid-data", "Customer name is required");
    }

    const customer = await CustomersCollection.findOneAsync(customerId);
    if (!customer) {
      throw new Meteor.Error("not-found", "Customer not found");
    }

    return await CustomersCollection.updateAsync(customerId, {
      $set: {
        name: name.trim(),
        email: email?.trim() || "",
        phone: phone?.trim() || "",
        company: company?.trim() || "",
        address: address?.trim() || "",
        updatedAt: new Date()
      }
    });
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

    return await CustomersCollection.removeAsync(customerId);
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

    return await NotesCollection.insertAsync({
      customerId,
      content: content.trim(),
      createdAt: new Date(),
      createdBy: this.userId,
      createdByName
    });
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

    return await NotesCollection.removeAsync(noteId);
  },

  async "users.create"(userData) {
    if (!this.userId) {
      throw new Meteor.Error("not-authorized", "You must be logged in");
    }

    const currentUser = await Meteor.users.findOneAsync(this.userId);
    if (!isAdmin(currentUser)) {
      throw new Meteor.Error("not-authorized", "Only admins can create users");
    }

    const { username, password, name, role } = userData;

    if (!username || username.trim() === "") {
      throw new Meteor.Error("invalid-data", "Username is required");
    }

    if (!password || password.length < 6) {
      throw new Meteor.Error("invalid-data", "Password must be at least 6 characters");
    }

    if (!name || name.trim() === "") {
      throw new Meteor.Error("invalid-data", "Name is required");
    }

    if (![ROLES.ADMIN, ROLES.USER].includes(role)) {
      throw new Meteor.Error("invalid-data", "Invalid role");
    }

    const existingUser = await Accounts.findUserByUsername(username.trim());
    if (existingUser) {
      throw new Meteor.Error("invalid-data", "Username already exists");
    }

    return await Accounts.createUserAsync({
      username: username.trim(),
      password,
      profile: {
        name: name.trim(),
        role
      }
    });
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

    return await Meteor.users.removeAsync(userId);
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
    return true;
  }
});
