import React, { useEffect, useState } from "react";
import { VenomConnect } from "venom-connect";
import { ProviderRpcClient } from "everscale-inpage-provider";

type Props = {
    index: number;
    address: string;
    amount: string;
};

function LeaderBoardItem({ index, address, amount }: Props) {
  
  return (
    <div className="leaderboard_item">
        <div className="leaderboard_address"><span className="leaderboard_rank_num">{index+1} {".   "}</span> {address?.slice(0,6)+"...."+address?.slice(address.length-6, address.length)}</div>
        <div className="leaderboard_amount">{parseFloat(amount)/(10**9)}</div>
    </div>
  );
}

export default LeaderBoardItem;
