import { prisma } from './src/config/db';
import bcrypt from 'bcrypt';
async function main() {
  const newHash = await bcrypt.hash('TempVerify@123', 10);
  await prisma.user.update({ where: { username: 'helen.adongo' }, data: { password: newHash } });
  console.log('reset');
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
