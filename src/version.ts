const commitCount = 280;

// Convert commit count to version format (x.y.z)
const major = Math.floor(commitCount / 100);
const minor = Math.floor((commitCount % 100) / 10);
const patch = commitCount % 10;

const version = `${major}.${minor}.${patch}`;

export default version;

