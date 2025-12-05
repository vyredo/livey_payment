const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkOrder() {
  const order = await prisma.order.findUnique({
    where: { id: '2e0330c3-c290-4b65-ac1d-bad2ce32fd76' },
    include: { seller: true }
  });
  
  if (order) {
    console.log('Order found:');
    console.log('- Seller ID:', order.seller.id);
    console.log('- Seller Name:', order.seller.name);
    console.log('- Seller Email:', order.seller.email);
    console.log('- Stripe Account ID:', order.seller.stripeAccountId || 'NOT SET');
    console.log('- Onboarding Complete:', order.seller.stripeOnboardingCompleted);
    console.log('- Account Status:', order.seller.stripeAccountStatus);
  } else {
    console.log('Order not found');
  }
  
  await prisma.$disconnect();
}

checkOrder().catch(console.error);
