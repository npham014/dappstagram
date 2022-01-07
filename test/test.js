const { assert, expect } = require('chai')

const Decentragram = artifacts.require('./Decentragram.sol')

require('chai')
  .use(require('chai-as-promised'))
  .should()

contract('Decentragram', ([deployer, author, tipper]) => {
  let decentragram;

  before(async () => {
    decentragram = await Decentragram.deployed();
  })

  describe('deployment', async () => {
    it('deploys successfully', async () => {
      const address = await decentragram.address;
      assert.notEqual(address, 0x0);
      assert.notEqual(address, '');
      assert.notEqual(address, null);
      assert.notEqual(address, undefined);
    })

    it('has a name', async () => {
      const name = await decentragram.name();
      assert.equal(name, 'Dappstagram');
    })
  })

  describe('images', async () => {
    let result, imageCount;
    const hash = 'abc123';
    before(async () => {
      result = await decentragram.uploadImage(hash, 'Image description', {from: author});
      imageCount = await decentragram.imageCount();
    })
    it ('creates images', async () => {
      const event = result.logs[0].args;
      //Checks for proper image creation
      assert.equal(event.id.toNumber(), imageCount.toNumber(), 'id is correct');
      assert.equal(event.hash, hash, 'Hash is correct');
      assert.equal(event.description, 'Image description', 'description is correct');
      assert.equal(event.tipAmount, '0', 'tip is correct');
      assert.equal(event.author, author, 'correct author');

      //Checks for missing or invalid values
      await decentragram.uploadImage("", "desc", {from: author}).should.be.rejected;
      await decentragram.uploadImage(hash, "", {from: author}).should.be.rejected;
      await decentragram.uploadImage(hash, "desc", {from: 0x0}).should.be.rejected;

      
    })

    it('lists images', async () => {
      const image = await decentragram.images(imageCount);
      assert.equal(image.id.toNumber(), imageCount.toNumber(), 'id is correct');
      assert.equal(image.hash, hash, 'Hash is correct');
      assert.equal(image.description, 'Image description', 'description is correct');
      assert.equal(image.tipAmount, '0', 'tip is correct');
      assert.equal(image.author, author, 'correct author');
    })

    it("lets users tip their favorite images", async () => {
      let oldBalance = await web3.eth.getBalance(author);
      oldBalance = new web3.utils.BN(oldBalance);

      result = await decentragram.tipImageOwner(imageCount, {from: tipper, value: web3.utils.toWei('1', 'Ether')});

      //Make sure the tip went through with the correct values
      const event = result.logs[0].args;
      assert.equal(event.id.toNumber(), imageCount.toNumber(), 'id is correct');
      assert.equal(event.hash, hash, 'Hash is correct');
      assert.equal(event.description, 'Image description', 'description is correct');
      assert.equal(event.tipAmount, '1000000000000000000', 'tip amount is correct');
      assert.equal(event.author, author, 'author is correct');

      let newBalance = await web3.eth.getBalance(author);
      newBalance = new web3.utils.BN(newBalance);
      
      let expectedBalance = oldBalance.add(new web3.utils.BN(web3.utils.toWei('1','Ether')));
      
      //Make sure that the balance arrived at the author's address
      assert.equal(newBalance.toString(), expectedBalance.toString());

      //Make sure that the tip fails if invalid address
      result = await decentragram.tipImageOwner(0, {from: tipper, value: web3.utils.toWei('1', 'Ether')}).should.be.rejected;
      
    });
  })
})