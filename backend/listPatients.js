import mongoose from 'mongoose';

const MONGO_URI = 'mongodb://localhost:27017/hospital_management';

const UserSchema = new mongoose.Schema({
    email: String,
    role: String,
});

const User = mongoose.model('User', UserSchema);

async function listPatients() {
    try {
        await mongoose.connect(MONGO_URI);
        const patients = await User.find({ role: 'patient' }).limit(5);
        console.log('--- Patients ---');
        patients.forEach(p => console.log(`Email: ${p.email}`));
        await mongoose.disconnect();
    } catch (err) {
        console.error(err);
    }
}

listPatients();
