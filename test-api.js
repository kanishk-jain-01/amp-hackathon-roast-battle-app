// Simple test for API routes
const { voteStore } = require('./lib/voteStore.ts');

console.log('Testing VoteStore API...\n');

try {
  // Test reset game
  console.log('1. Testing resetGame():');
  const resetState = voteStore.resetGame();
  console.log('✓ Game reset successfully');
  console.log('State:', JSON.stringify(resetState, null, 2));

  // Test start round
  console.log('\n2. Testing startRound():');
  const startState = voteStore.startRound('Pineapple on pizza');
  console.log('✓ Round started successfully');
  console.log('Topic:', startState.topic);

  // Test set AI roast
  console.log('\n3. Testing setAIRoast():');
  const aiState = voteStore.setAIRoast('That topic is so controversial, even my circuits are confused!');
  console.log('✓ AI roast set successfully');

  // Test open voting
  console.log('\n4. Testing openVoting():');
  const openState = voteStore.openVoting();
  console.log('✓ Voting opened:', openState.isVotingOpen);

  // Test submit vote
  console.log('\n5. Testing submitVote():');
  const voteResult = voteStore.submitVote('ai');
  console.log('✓ Vote submitted:', voteResult.success);
  console.log('Message:', voteResult.message);

  // Test get vote stats
  console.log('\n6. Testing getVoteStats():');
  const stats = voteStore.getVoteStats();
  console.log('✓ Vote stats retrieved');
  console.log('Stats:', JSON.stringify(stats, null, 2));

  console.log('\n✓ All voteStore functions working correctly!');

} catch (error) {
  console.error('✗ Error testing voteStore:', error.message);
}
