import newIntegrationClient from "./client/index.js";
import Hbar from "../src/Hbar.js";
import Status from "../src/Status.js";
import AccountBalanceQuery from "../src/account/AccountBalanceQuery.js";
import AccountCreateTransaction from "../src/account/AccountCreateTransaction.js";
import AccountDeleteTransaction from "../src/account/AccountDeleteTransaction.js";
import TokenCreateTransaction from "../src/token/TokenCreateTransaction.js";
import TokenAssociateTransaction from "../src/token/TokenAssociateTransaction.js";
import TransactionId from "../src/transaction/TransactionId.js";
import { PrivateKey } from "../src/exports.js";

describe("AccountBalanceQuery", function () {
    this.timeout(15000);
    let client;

    before(async function () {
        client = await newIntegrationClient();
    });

    describe("#execute", function () {
        it("account 0.0.3 should have a balance higher than 1 hbar", async function () {
            const balance = await new AccountBalanceQuery()
                .setAccountId("3") // balance of node 3
                .execute(client);

            expect(balance.hbars.toTinybars().toNumber()).to.be.greaterThan(
                new Hbar(1).toTinybars().toNumber()
            );
        });

        it("an account that does not exist should return an error", async function () {
            let err = false;

            try {
                await new AccountBalanceQuery()
                    .setAccountId("1.0.3")
                    .execute(client);
            } catch (error) {
                err = error
                    .toString()
                    .includes(Status.InvalidAccountId.toString());
            }

            if (!err) {
                throw new Error("query did not error");
            }
        });
    });

    it("should reflect token with no keys", async function () {
        this.timeout(10000);

        const operatorId = client.operatorAccountId;
        const key = PrivateKey.generate();

        let response = await new AccountCreateTransaction()
            .setKey(key)
            .setInitialBalance(new Hbar(2))
            .execute(client);

        const account = (await response.getReceipt(client)).accountId;

        response = await new TokenCreateTransaction()
            .setTokenName("ffff")
            .setTokenSymbol("F")
            .setTreasuryAccountId(operatorId)
            .execute(client);

        const token = (await response.getReceipt(client)).tokenId;

        await (
            await (
                await new TokenAssociateTransaction()
                    .setTokenIds([token])
                    .setAccountId(account)
                    .freezeWith(client)
                    .sign(key)
            ).execute(client)
        ).getReceipt(client);

        const balances = await new AccountBalanceQuery()
            .setAccountId(account)
            .execute(client);

        expect(balances.tokens.get(token).toInt()).to.be.equal(0);

        await (
            await (
                await new AccountDeleteTransaction()
                    .setAccountId(account)
                    .setNodeAccountIds([response.nodeId])
                    .setTransferAccountId(operatorId)
                    .setTransactionId(TransactionId.generate(account))
                    .freezeWith(client)
                    .sign(key)
            ).execute(client)
        ).getReceipt(client);
    });
});
