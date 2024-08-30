import { NgFor, NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, makeStateKey, OnInit, TransferState } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { Button } from 'primeng/button';
import { DataViewModule, } from 'primeng/dataview';
import { finalize, tap } from 'rxjs';

const DATA_KEY = makeStateKey<any>('apiData');

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [DataViewModule, NgFor, RouterLink, Button, NgIf],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  pokemons: any[] = []
  isLoading = true
  metadata = {
    count: 0,
    limit: 0,
    offset: 0,
    next: undefined as unknown as string,
    previous: undefined as unknown as string
  }

  constructor(
    private http: HttpClient,
    private state: TransferState,
    private activatedRoute: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    const page = Number(this.activatedRoute.snapshot.queryParams['page'])

    if (Number.isNaN(page) || page < 1) {
      this.fetchPokemons()
      return
    }


    this.fetchPokemons(`https://pokeapi.co/api/v2/pokemon?offset=${(page - 1) * 9}&limit=9`)
  }

  fetchPokemons(url?: string): void {
    this.isLoading = true

    const apiUrl = url || 'https://pokeapi.co/api/v2/pokemon?offset=0&limit=9'

    this.http.get<any>(apiUrl).pipe(
      tap(data => {
        this.state.set(DATA_KEY, data)
      }),
      finalize(() => {
        this.isLoading = false
      })
    ).subscribe(data => {
      this.metadata = {
        count: data.count,
        next: data.next,
        previous: data.previous,
        limit: 9,
        offset: Number(apiUrl.replace(/.+offset=([0-9]+).+$/, '$1'))
      }

      if (typeof window === 'undefined') {
        console.log('somente server')
      } else {
        console.log('somente client')
      }

      this.router.navigate([], {
        queryParams: {
          page: (this.metadata.offset / this.metadata.limit) + 1
        }
      })

      this.pokemons = []

      for (const pokemon of data.results) {
        this.http.get<any>(pokemon.url).subscribe(pokemonData => {
          this.pokemons.push(pokemonData)
        })
      }
    })
  }
}
