import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuctionService } from 'src/app/Services/Auction/auction.service';
import { AuctionDetails } from 'src/app/models/AuctionDetails';
import { Bid } from 'src/app/models/Bid';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

@Component({
    selector: 'app-auction-detail',
    templateUrl: './auction-detail.component.html',
    styleUrls: ['./auction-detail.component.css'],
    standalone: false
})
export class AuctionDetailComponent {
  auctionId!: number;
  auction!: AuctionDetails;
  userId?: number;
  myForm!: FormGroup;
  currentPrice!: number;
  auctionOver: boolean = false; // new property

  constructor(private route: ActivatedRoute, private auctionService: AuctionService, private router: Router) { }

  ngOnInit() {

    this.myForm = new FormGroup({
      price: new FormControl(null, Validators.required),
    });

    this.auctionId = Number(this.route.snapshot.paramMap.get('id'));

    const userId = localStorage.getItem('userId');
    this.userId = userId ? Number(userId) : undefined;

    // Retrieve the auction details and determine if it is over
    this.auctionService.getAuction(this.auctionId).subscribe(auction => {
        console.log(auction);
        this.auction = auction;
        this.auctionOver = new Date(this.auction.endDate) < new Date();
    });

    // Also retrieve the bids and calculate the current price.
    forkJoin([this.auctionService.getAuction(this.auctionId), this.auctionService.getBids(this.auctionId)]).subscribe(result => {
      const auction = result[0];
      const bids = result[1];
      this.auction = auction;
      this.auctionOver = new Date(this.auction.endDate) < new Date();

      if (bids.length > 0) {
        this.currentPrice = Math.max(...bids.map(bid => bid.price));
      } else {
        this.currentPrice = this.auction.minPrice;
      }
    });
  }

  addBid(price: number) {
    // Prevent bid submission if the auction is over.
    if (this.auctionOver) {
       alert('Auction is over. You cannot place a bid.');
       return;
    }
    if (this.userId) {
      const bid: Bid = {
        userId: this.userId,
        price: price
      };
      this.auctionService.addBid(this.auctionId, bid).subscribe(id => {
        console.log(id);
        alert("Bid succeeded");
        this.router.navigate(['/Auctions']);
      });
    }
  }

  onSubmit() {
    // Check for auction expiration before allowing the bid.
    if (this.auctionOver) {
       alert("Auction is over. You cannot place a bid.");
       return;
    }
    console.log(this.myForm.value.price);
    this.addBid(this.myForm.value.price);
  }
}
